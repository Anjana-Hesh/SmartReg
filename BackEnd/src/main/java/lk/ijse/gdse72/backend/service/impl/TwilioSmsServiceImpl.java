package lk.ijse.gdse72.backend.service.impl;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lk.ijse.gdse72.backend.service.SmsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TwilioSmsServiceImpl implements SmsService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }

    @Override
    public void sendSms(String phoneNumber, String message) {
        if (!phoneNumber.startsWith("+94")) {
            if (phoneNumber.startsWith("0")) {
                phoneNumber = "+94" + phoneNumber.substring(1);
            } else {
                phoneNumber = "+94" + phoneNumber; // 0 nathuwa number ekak
            }
        }
        Message.creator(
                new PhoneNumber(phoneNumber),
                new PhoneNumber(fromNumber),
                message
        ).create();
    }
}
