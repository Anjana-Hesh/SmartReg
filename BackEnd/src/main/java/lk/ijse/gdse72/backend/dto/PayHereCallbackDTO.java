package lk.ijse.gdse72.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayHereCallbackDTO {
    private String merchant_id;
    private String order_id;
    private String payment_id;
    private String payhere_amount;
    private String payhere_currency;
    private String status_code;
    private String md5sig;
    private String custom_1; // Our transaction ID
    private String custom_2; // Application ID
    private String method;
    private String status_message;
    private String card_holder_name;
    private String card_no;
    private String card_expiry;
}