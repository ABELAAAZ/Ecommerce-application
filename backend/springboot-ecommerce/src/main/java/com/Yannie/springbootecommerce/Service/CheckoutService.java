package com.Yannie.springbootecommerce.Service;

import com.Yannie.springbootecommerce.dto.Purchase;
import com.Yannie.springbootecommerce.dto.PurchaseResponse;

public interface CheckoutService {

    PurchaseResponse placeOrder(Purchase purchase);
}
