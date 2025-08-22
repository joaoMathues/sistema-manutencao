# Sistema de Manutenção Preventiva Industrial

Sistema completo de monitoramento e manutenção preventiva para máquinas industriais com conexão OPC UA.

## 🚀 Funcionalidades

- **Dashboard** em tempo real com estatísticas de máquinas
- **Monitoramento OPC UA** para conexão com máquinas industriais reais
- **Gerenciamento de Máquinas** - CRUD completo
- **Sistema de Alertas** com notificações via WhatsApp
- **Gestão de Técnicos** com especialidades e responsabilidades
- **Interface Responsiva** para desktop e mobile
- **Interface em Português** - Totalmente localizado

## 📋 Tecnologias Utilizadas

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Chart.js para visualizações
- Design responsivo

### Backend
- Python 3.x
- Flask (API REST)
- OPC UA Client (opcua)
- Threading para monitoramento contínuo

## 🛠️ Instalação e Configuração

### Pré-requisitos
```bash
pip install opcua flask
```

### Executar o Sistema

1. **Iniciar o Backend:**
```bash
python backend_server.py
```

2. **Iniciar o Frontend:**
```bash
python -m http.server 8000
```

3. **Acessar o Sistema:**
- Frontend: http://localhost:8000
- Backend API: http://localhost:5000

## 🔧 Configuração OPC UA

Configure suas máquinas no arquivo `backend_server.py`:

```python
MACHINES_CONFIG = {
    "M001": {
        "name": "Torno CNC 1",
        "ip": "192.168.1.100",
        "opc_url": "opc.tcp://192.168.1.100:4840",
        "variables": {
            "V001": {"node": "ns=2;i=1", "description": "Nível do óleo", "unit": "%"}
        }
    }
}
```

## 📊 Endpoints da API

### Máquinas
- `GET /api/machines` - Listar todas as máquinas
- `POST /api/machine/<id>/test` - Testar conexão
- `PUT /api/machine/<id>` - Atualizar máquina
- `DELETE /api/machine/<id>` - Remover máquina

## 📱 Uso

### Dashboard
Visualize estatísticas em tempo real:
- Máquinas online/offline
- Uptime médio
- Alertas ativos
- Tendências de variáveis

### Gerenciamento
- Adicionar novas máquinas
- Configurar variáveis de monitoramento
- Cadastrar técnicos
- Definir limites de alerta

### Alertas
- Notificações automáticas via WhatsApp
- Classificação por nível (warning/critical)
- Histórico de manutenções

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autor
João Matheus Borba

Desenvolvido para sistemas industriais de manutenção preventiva.
