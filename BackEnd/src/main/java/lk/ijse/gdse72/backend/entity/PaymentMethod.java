package lk.ijse.gdse72.backend.entity;

public enum PaymentMethod {
    CARD("card", "Credit/Debit Card"),
    BANK("bank", "Bank Transfer"),
    MOBILE("mobile", "Mobile Payment");

    private final String code;
    private final String displayName;

    PaymentMethod(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    public String getCode() { return code; }
    public String getDisplayName() { return displayName; }
}
