#!/usr/bin/env python3
"""
Backend OPC UA para Sistema de Manutenção Preventiva
Conecta com máquinas reais via OPC UA
"""
from flask import Flask, jsonify, request, send_from_directory
from opcua import Client
import threading
import time
import json
from datetime import datetime

app = Flask(__name__)

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

# Rotas da API
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/machines')
def get_machines():
    """Retorna dados das máquinas"""
    return jsonify(monitor.machines_data)

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

if __name__ == '__main__':
    # Inicia o monitoramento em thread separada
    monitor_thread = threading.Thread(target=monitor.monitor_machines)
    monitor_thread.daemon = True
    monitor_thread.start()
    
    # Inicia o servidor Flask
    app.run(host='0.0.0.0', port=5000, debug=True)
