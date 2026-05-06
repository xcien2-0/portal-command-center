import requests
import json
import os

class TelegramBot:
    def __init__(self, token=None, chat_id=None):
        self.token = token or os.environ.get("TELEGRAM_BOT_TOKEN")
        self.chat_id = chat_id or os.environ.get("TELEGRAM_CHAT_ID")
        self.api_url = f"https://api.telegram.org/bot{self.token}/sendMessage"

    def send_message(self, text):
        if not self.token or not self.chat_id:
            return {"status": "error", "message": "Falta configuración de Telegram (Token o Chat ID)"}
        
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "Markdown"
        }
        
        try:
            response = requests.post(self.api_url, json=payload, timeout=10)
            if response.ok:
                return {"status": "success", "data": response.json()}
            else:
                return {"status": "error", "message": response.text}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def send_alert(self, alert_data):
        # Formatear la alerta para que se vea profesional en Telegram
        severity_emoji = "🔴" if alert_data.get('severity') == 'critical' else "🟡"
        message = (
            f"{severity_emoji} *ALERTA DE RED XCIEN*\n\n"
            f"📍 *Ciudad:* {alert_data.get('city', 'N/A')}\n"
            f"📡 *Equipo:* {alert_data.get('host', 'N/A')}\n"
            f"⚠️ *Falla:* {alert_data.get('description', 'N/A')}\n"
            f"⏰ *Hora:* {alert_data.get('ts', 'Justo ahora')}\n\n"
            f"🔗 [Ver en el Portal](http://localhost:8080/xcien2?section=noc)"
        )
        return self.send_message(message)

    def send_document(self, file_path, caption=None):
        if not self.token or not self.chat_id:
            return {"status": "error", "message": "Falta configuración de Telegram"}
        
        url = f"https://api.telegram.org/bot{self.token}/sendDocument"
        try:
            with open(file_path, 'rb') as f:
                files = {'document': f}
                data = {'chat_id': self.chat_id, 'caption': caption, 'parse_mode': 'Markdown'}
                response = requests.post(url, files=files, data=data, timeout=30)
                if response.ok:
                    return {"status": "success", "data": response.json()}
                else:
                    return {"status": "error", "message": response.text}
        except Exception as e:
            return {"status": "error", "message": str(e)}
