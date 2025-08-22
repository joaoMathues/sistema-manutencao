#!/usr/bin/env python3
"""
Backend OPC UA para Sistema de Manutenção Preventiva
Conecta com máquinas reais via OPC UA
"""
import json
import os
import requests  # usado para chamar internamente /api/send_whatsapp se preferir
import socket
from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except Exception:
    CORS = None

app = Flask(__name__)
if CORS:
    CORS(app)

# Configurações
MACHINES_CONFIG = {
    "M001": {
        "name": "Torno CNC 1",
        "ip": "192.168.1.100",
        "opc_url": "opc.tcp://192.168.1.100:4840",
        "variables": {
            "V001": {"node": "ns=2;i=1", "description": "Nível do óleo", "unit": "%"},
            "V002": {"node": "ns=2;i=2", "description": "Temperatura do motor", "unit": "°C"},
            "V003": {"node": "ns=2;i=3", "description": "Nível de vibração", "unit": "mm/s"}
        }
    },
    "M002": {
        "name": "Fresadora Universal", 
        "ip": "192.168.1.101",
        "opc_url": "opc.tcp://192.168.1.101:4840",
        "variables": {
            "V004": {"node": "ns=2;i=4", "description": "Pressão hidráulica", "unit": "bar"},
            "V005": {"node": "ns=2;i=5", "description": "Nível fluido de corte", "unit": "%"}
        }
    }
}

class OPCUAMonitor:
    def __init__(self):
        self.machines_data = {}
        self.running = True
        
    def connect_machine(self, machine_id, opc_url):
        """Conecta a uma máquina OPC UA"""
        try:
            client = Client(opc_url)
            client.connect()
            return client
        except Exception as e:
            print(f"Erro ao conectar {machine_id}: {e}")
            return None
    
    def read_variable(self, client, node_id):
        """Lê uma variável OPC UA"""
        try:
            node = client.get_node(node_id)
            value = node.get_value()
            return value
        except Exception as e:
            print(f"Erro ao ler variável {node_id}: {e}")
            return None
    
    def monitor_machines(self):
        """Monitora máquinas continuamente"""
        while self.running:
            for machine_id, config in MACHINES_CONFIG.items():
                try:
                    client = self.connect_machine(machine_id, config["opc_url"])
                    if client:
                        machine_data = {
                            "id": machine_id,
                            "name": config["name"],
                            "status": "online",
                            "uptime": 95.0,
                            "variables": []
                        }
                        
                        for var_id, var_config in config["variables"].items():
                            value = self.read_variable(client, var_config["node"])
                            if value is not None:
                                machine_data["variables"].append({
                                    "id": var_id,
                                    "name": var_config["description"].lower().replace(" ", "_"),
                                    "description": var_config["description"],
                                    "currentValue": value,
                                    "unit": var_config["unit"],
                                    "active": True
                                })
                        
                        self.machines_data[machine_id] = machine_data
                        client.disconnect()
                    else:
                        self.machines_data[machine_id] = {
                            "id": machine_id,
                            "name": config["name"],
                            "status": "offline",
                            "uptime": 0,
                            "variables": []
                        }
                        
                except Exception as e:
                    print(f"Erro ao monitorar {machine_id}: {e}")
                    self.machines_data[machine_id] = {
                        "id": machine_id,
                        "name": config["name"],
                        "status": "offline",
                        "uptime": 0,
                        "variables": []
                    }
            
            time.sleep(5)  # Atualiza a cada 5 segundos

# Instância global
monitor = OPCUAMonitor()

# lista em memória (volátil)
active_machines = []

# Rotas da API
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/machines')
def get_machines():
    """Retorna dados das máquinas"""
    return jsonify(monitor.machines_data)

@app.route('/api/active_machines', methods=['GET', 'POST'])
def api_active_machines():
    global active_machines
    if request.method == 'GET':
        return jsonify(active_machines)
    data = request.get_json() or {}
    if not data.get('name') or not data.get('opcServer'):
        return jsonify({'error': 'missing name or opcServer'}), 400
    mid = data.get('id') or f"M{len(active_machines)+1:03d}"
    existing = next((m for m in active_machines if m.get('id') == mid or m.get('opcServer') == data.get('opcServer')), None)
    if existing:
        existing.update({**data, 'id': mid})
        machine = existing
    else:
        machine = {**data, 'id': mid}
        active_machines.append(machine)
    return jsonify({'status': 'ok', 'machine': machine}), 201

@app.route('/api/test_connection', methods=['POST'])
def api_test_connection():
    """
    Body: { "opcServer": "opc.tcp://HOST:PORT" }
    Retorna { reachable: true/false, error?: "...}
    """
    data = request.get_json() or {}
    uri = data.get('opcServer', '')
    if not uri.startswith('opc.tcp://'):
        return jsonify({'reachable': False, 'error': 'invalid uri'}), 400
    # extrair host:port
    try:
        hostport = uri.replace('opc.tcp://', '').split('/')[0]
        host, port = hostport.split(':')
        port = int(port)
    except Exception as e:
        return jsonify({'reachable': False, 'error': 'parse error'}), 400
    try:
        with socket.create_connection((host, port), timeout=3):
            return jsonify({'reachable': True}), 200
    except Exception as e:
        return jsonify({'reachable': False, 'error': str(e)}), 200

@app.route('/api/machine/<machine_id>/test', methods=['POST'])
def test_machine(machine_id):
    """Testa conexão com uma máquina"""
    if machine_id in MACHINES_CONFIG:
        config = MACHINES_CONFIG[machine_id]
        try:
            client = Client(config["opc_url"])
            client.connect()
            client.disconnect()
            return jsonify({"success": True, "message": "Conexão bem-sucedida!"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)})
    
    return jsonify({"success": False, "message": "Máquina não encontrada"})

@app.route('/api/machine/<machine_id>', methods=['DELETE'])
def delete_machine(machine_id):
    """Remove uma máquina"""
    if machine_id in MACHINES_CONFIG:
        del MACHINES_CONFIG[machine_id]
        return jsonify({"success": True, "message": "Máquina removida com sucesso!"})
    return jsonify({"success": False, "message": "Máquina não encontrada"})

@app.route('/api/machine/<machine_id>', methods=['PUT'])
def update_machine(machine_id):
    """Atualiza dados de uma máquina"""
    data = request.json
    if machine_id in MACHINES_CONFIG:
        MACHINES_CONFIG[machine_id].update(data)
        return jsonify({"success": True, "message": "Máquina atualizada com sucesso!"})
    return jsonify({"success": False, "message": "Máquina não encontrada"})

@app.route('/api/opcua_alert', methods=['POST'])
def api_opcua_alert():
    """
    Recebe alerta do opcua_backend.js.
    Payload esperado (exemplo):
    {
      "machineId": "M001",
      "machineName": "Torno CNC 1",
      "variableId": "V001",
      "variableName": "Nível do óleo",
      "level": "critical",    # or "warning"
      "currentValue": 10,
      "threshold": 20,
      "unit": "%",
      "timestamp": "2025-08-21T12:00:00Z"
    }
    """
    data = request.get_json() or {}
    # validação básica
    required = ['machineId','machineName','variableId','variableName','level','currentValue','threshold']
    if not all(k in data for k in required):
        return jsonify({'error': 'payload inválido'}), 400

    # decidir técnico responsável (simples): procurar no dataset em memória se disponível
    # Se seu backend tiver persistência, adapte. Aqui executamos envio diretamente via Twilio endpoint.
    technician_phone = data.get('to')  # opcional: opcua backend pode enviar to; caso contrário backend decide

    # montar mensagem (mesma formatação do frontend)
    timestamp = data.get('timestamp')
    message = None
    if data['level'] == 'critical':
        message = f"🚨 CRÍTICO: {data['machineName']}\n📊 Variável: {data['variableName']}\n📈 Valor atual: {data['currentValue']} {data.get('unit','')}\n🔴 Limite crítico: {data['threshold']} {data.get('unit','')}\n⏰ Horário: {timestamp}\n🔧 Ação necessária imediatamente!"
    else:
        message = f"⚠️ ALERTA: {data['machineName']}\n📊 Variável: {data['variableName']}\n📈 Valor atual: {data['currentValue']} {data.get('unit','')}\n🔔 Limite: {data['threshold']} {data.get('unit','')}\n⏰ Horário: {timestamp}"

    # Se opcua_backend informar 'to' (telefone do técnico), usa; senão, devolve OK e você pode implementar lookup
    if technician_phone:
        # chama o endpoint interno /api/send_whatsapp para manter lógica centralizada
        try:
            resp = requests.post('http://localhost:5000/api/send_whatsapp',
                                 json={'to': technician_phone, 'message': message})
            return jsonify({'status': 'forwarded', 'twilio': resp.json()}), resp.status_code
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # se não houver telefone, retorna OK (ou aqui você pode implementar lookup por máquina -> técnico)
    return jsonify({'status': 'received', 'message_preview': message}), 200

if __name__ == '__main__':
    # Inicia o monitoramento em thread separada
    monitor_thread = threading.Thread(target=monitor.monitor_machines)
    monitor_thread.daemon = True
    monitor_thread.start()
    
    # Inicia o servidor Flask
    app.run(host='0.0.0.0', port=5000, debug=True)
