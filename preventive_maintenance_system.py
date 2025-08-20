
import asyncio
from opcua import Client
import time
import requests
import json
from datetime import datetime

class PreventiveMaintenanceSystem:
    def __init__(self, config_file="system_config.json"):
        self.machines = []
        self.technicians = []
        self.alert_templates = {}
        self.load_config(config_file)

    def load_config(self, config_file):
        """Carrega configuração do sistema"""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                self.machines = config['machines']
                self.technicians = config['technicians']
                self.alert_templates = config['alert_templates']
            print("Configuração carregada com sucesso!")
        except Exception as e:
            print(f"Erro ao carregar configuração: {e}")

    async def connect_opc_client(self, machine):
        """Conecta ao servidor OPC UA da máquina"""
        try:
            client = Client(machine['opc_server'])
            await client.connect()
            print(f"Conectado à máquina {machine['name']}")
            return client
        except Exception as e:
            print(f"Erro ao conectar à máquina {machine['name']}: {e}")
            return None

    async def read_variable(self, client, variable):
        """Lê uma variável do servidor OPC UA"""
        try:
            node = client.get_node(variable['node_id'])
            value = await node.read_value()
            return value
        except Exception as e:
            print(f"Erro ao ler variável {variable['name']}: {e}")
            return None

    def check_alerts(self, machine, variable, current_value):
        """Verifica se o valor atual requer alerta"""
        if current_value is None:
            return None

        # Verifica limite crítico
        if current_value <= variable['critical_threshold']:
            return {
                'level': 'critical',
                'machine': machine,
                'variable': variable,
                'current_value': current_value,
                'threshold': variable['critical_threshold']
            }

        # Verifica limite de alerta
        elif current_value <= variable['alert_threshold']:
            return {
                'level': 'warning', 
                'machine': machine,
                'variable': variable,
                'current_value': current_value,
                'threshold': variable['alert_threshold']
            }

        return None

    def send_whatsapp_alert(self, alert_info):
        """Envia alerta via WhatsApp"""
        try:
            # Encontra técnicos responsáveis pela máquina
            responsible_technicians = [
                tech for tech in self.technicians 
                if alert_info['machine']['id'] in tech['responsible_machines']
            ]

            # Monta mensagem
            template = self.alert_templates[alert_info['level']]
            message = template.format(
                machine_name=alert_info['machine']['name'],
                variable_name=alert_info['variable']['description'],
                current_value=alert_info['current_value'],
                unit=alert_info['variable']['unit'],
                threshold=alert_info['threshold'],
                timestamp=datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            )

            # Envia para cada técnico responsável
            for tech in responsible_technicians:
                self.send_message_to_whatsapp(tech['whatsapp'], message)
                print(f"Alerta enviado para {tech['name']}: {tech['whatsapp']}")

        except Exception as e:
            print(f"Erro ao enviar alerta WhatsApp: {e}")

    def send_message_to_whatsapp(self, phone_number, message):
        """Função para enviar mensagem via API do WhatsApp"""
        # Aqui você integraria com uma API real do WhatsApp
        # Exemplos: Twilio, WhatsApp Business API, etc.

        # Simulação de envio
        print(f"📱 Enviando para {phone_number}:")
        print(f"💬 {message}")
        print("-" * 50)

        # Exemplo de integração real (descomente e configure):
        # api_url = "https://api.whatsapp.com/send"
        # payload = {
        #     "phone": phone_number,
        #     "message": message
        # }
        # response = requests.post(api_url, json=payload)
        # return response.status_code == 200

    async def monitor_machine(self, machine):
        """Monitora uma máquina específica"""
        client = await self.connect_opc_client(machine)
        if not client:
            return

        try:
            while True:
                print(f"\n🔍 Monitorando {machine['name']}...")

                for variable in machine['variables']:
                    # Lê valor atual
                    current_value = await self.read_variable(client, variable)

                    if current_value is not None:
                        print(f"  📊 {variable['description']}: {current_value} {variable['unit']}")

                        # Verifica se precisa alertar
                        alert = self.check_alerts(machine, variable, current_value)
                        if alert:
                            print(f"  🚨 ALERTA DETECTADO!")
                            self.send_whatsapp_alert(alert)

                # Aguarda próxima leitura (30 segundos)
                await asyncio.sleep(30)

        except Exception as e:
            print(f"Erro no monitoramento: {e}")
        finally:
            await client.disconnect()

    async def start_monitoring(self):
        """Inicia monitoramento de todas as máquinas"""
        print("🚀 Iniciando sistema de manutenção preventiva...")

        # Cria tasks para monitorar todas as máquinas simultaneamente
        tasks = []
        for machine in self.machines:
            task = asyncio.create_task(self.monitor_machine(machine))
            tasks.append(task)

        # Executa todas as tasks
        await asyncio.gather(*tasks)

# Exemplo de uso
async def main():
    system = PreventiveMaintenanceSystem()
    await system.start_monitoring()

if __name__ == "__main__":
    asyncio.run(main())
