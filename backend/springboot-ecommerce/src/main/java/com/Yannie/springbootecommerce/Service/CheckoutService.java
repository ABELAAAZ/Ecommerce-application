package com.Yannie.springbootecommerce.Service;

import com.Yannie.springbootecommerce.dto.PaymentInfo;
import com.Yannie.springbootecommerce.dto.Purchase;
import com.Yannie.springbootecommerce.dto.PurchaseResponse;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

public interface CheckoutService {

    PurchaseResponse placeOrder(Purchase purchase);

    PaymentIntent createPaymentIntent(PaymentInfo paymentInfo) throws StripeException;
}
