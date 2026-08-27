package cm.marcheplus.gateway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * BroadcastReceiver Kotlin pour intercepter les SMS entrants MTN Mobile Money / Orange Money
 * et les transmettre en temps réel à votre serveur backend MarchéPlus pour validation automatique.
 */
class MtnSmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "MtnSmsReceiver"
        // Remplacez par l'adresse IP ou domaine de votre VPS
        private const val BACKEND_GATEWAY_URL = "http://VOTRE_VPS_IP:5000/api/gateway/sms"
        private const val GATEWAY_SECRET_KEY = "MARCHEPLUS_ANDROID_SECRET_KEY_2026"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
            for (sms in messages) {
                val sender = sms.originatingAddress ?: ""
                val body = sms.messageBody ?: ""

                Log.d(TAG, "SMS reçu de [$sender]: $body")

                // Filtrer les SMS émis par les passerelles MTN MoMo / Orange Money
                if (isPaymentSms(sender, body)) {
                    sendSmsToServer(sender, body, sms.timestampMillis)
                }
            }
        }
    }

    private fun isPaymentSms(sender: String, body: String): Boolean {
        val lowerBody = body.lowercase()
        return sender.contains("MTN", ignoreCase = true) ||
               sender.contains("MobileMoney", ignoreCase = true) ||
               sender.contains("OrangeMoney", ignoreCase = true) ||
               lowerBody.contains("transaction id") ||
               lowerBody.contains("transfert de") ||
               lowerBody.contains("vous avez recu") ||
               lowerBody.contains("vous avez reçu")
    }

    private fun sendSmsToServer(sender: String, message: String, timestamp: Long) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(BACKEND_GATEWAY_URL)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                conn.setRequestProperty("x-gateway-key", GATEWAY_SECRET_KEY)
                conn.doOutput = true
                conn.connectTimeout = 8000
                conn.readTimeout = 8000

                val payload = JSONObject().apply {
                    put("sender", sender)
                    put("message", message)
                    put("receivedAt", timestamp)
                }

                conn.outputStream.use { os ->
                    os.write(payload.toString().toByteArray(Charsets.UTF_8))
                }

                val responseCode = conn.responseCode
                Log.d(TAG, "Réponse du serveur MarchéPlus : $responseCode")
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Erreur lors de la transmission du SMS au serveur : ${e.message}")
            }
        }
    }
}
