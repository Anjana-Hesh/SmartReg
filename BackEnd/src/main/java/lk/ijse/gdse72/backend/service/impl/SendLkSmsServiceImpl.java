//package lk.ijse.gdse72.backend.service.impl;
//
//import lk.ijse.gdse72.backend.service.SmsService;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//
//import java.io.OutputStream;
//import java.net.HttpURLConnection;
//import java.net.URL;
//import java.nio.charset.StandardCharsets;
//
//@Service
//public class SendLkSmsServiceImpl implements SmsService {
//
//    @Value("${sendlk.api-key}")
//    private String apiKey;
//
//    @Value("${sendlk.sender-id}")
//    private String senderId;
//
//    @Override
//    public void sendSms(String phoneNumber, String message) {
//        try {
//            // Send.lk API Endpoint
//            String apiUrl = "https://sms.send.lk/api/v3/sms/send";
//
//            // Data to be sent
//            String postData = "api_key=" + apiKey +
//                    "&sender_id=" + senderId +
//                    "&to=" + phoneNumber +
//                    "&message=" + message;
//
//            URL url = new URL(apiUrl);
//            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
//
//            // Set up the connection properties
//            connection.setRequestMethod("POST");
//            connection.setDoOutput(true);
//
//            // Send the data
//            try (OutputStream os = connection.getOutputStream()) {
//                byte[] input = postData.getBytes(StandardCharsets.UTF_8);
//                os.write(input, 0, input.length);
//            }
//
//            // Get the response (optional, but good for debugging)
//            int responseCode = connection.getResponseCode();
//            if (responseCode == HttpURLConnection.HTTP_OK) {
//                // Success
//                System.out.println("SMS sent successfully via Send.lk");
//            } else {
//                // Handle error
//                System.err.println("Failed to send SMS. Response Code: " + responseCode);
//            }
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            // Handle exceptions
//        }
//    }
//}