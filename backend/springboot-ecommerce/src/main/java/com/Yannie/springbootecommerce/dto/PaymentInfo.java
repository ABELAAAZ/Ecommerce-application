package com.Yannie.springbootecommerce.dto;

import lombok.Data;

@Data
public class PaymentInfo {
    private int amount;  //smallest denomination
    private String currency;
    private String receiptEmail;


}
