package com.Yannie.springbootecommerce.Service;

import com.Yannie.springbootecommerce.dao.CustomerRepository;
import com.Yannie.springbootecommerce.dto.PaymentInfo;
import com.Yannie.springbootecommerce.dto.Purchase;
import com.Yannie.springbootecommerce.dto.PurchaseResponse;
import com.Yannie.springbootecommerce.entity.Customer;
import com.Yannie.springbootecommerce.entity.Order;
import com.Yannie.springbootecommerce.entity.OrderItem;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import javax.transaction.Transactional;
import java.util.*;

@Service
public class CheckoutServiceImpl implements CheckoutService {

    private CustomerRepository customerRepository;

    public CheckoutServiceImpl(CustomerRepository customerRepository,
                               @Value("${stripe.key.secret}") String secretKey) {
        Stripe.apiKey=secretKey;
        this.customerRepository = customerRepository;

    }

    @Override
    @Transactional
    public PurchaseResponse placeOrder(Purchase purchase) {

        // retrieve the order info from dto
        Order order = purchase.getOrder();

        // generate tracking number
        String orderTrackingNumber = generateOrderTrackingNumber();
        order.setOrderTrackingNumber(orderTrackingNumber);

        // populate order with orderItems
        Set<OrderItem> orderItems = purchase.getOrderItems();
        orderItems.forEach(item -> order.add(item));

        // populate order with billingAddress and shippingAddress
        order.setBillingAddress(purchase.getBillingAddress());
        order.setShippingAddress(purchase.getShippingAddress());

        // populate customer with order
        Customer customer = purchase.getCustomer();

        String theEmail= customer.getEmail();
        Customer customerFromDB= customerRepository.findByEmail(theEmail);
        if (customerFromDB != null){
            customer=customerFromDB;
        }


        customer.add(order);

        // save to the database
        customerRepository.save(customer);

        // return a response
        return new PurchaseResponse(orderTrackingNumber);
    }

    @Override
    public PaymentIntent createPaymentIntent(PaymentInfo paymentInfo) throws StripeException {
        List<String> paymentMethodTypes =new ArrayList<>();
        paymentMethodTypes.add("card");
        Map<String,Object> params =new HashMap<>();
        params.put("amount",paymentInfo.getAmount());
        params.put("currency",paymentInfo.getCurrency());
        params.put("payment_method_types",paymentMethodTypes);
        params.put("description","Yanniestore purchase");
        params.put("receipt_email",paymentInfo.getReceiptEmail());
        return PaymentIntent.create(params);

    }

    private String generateOrderTrackingNumber() {

        // generate a random UUID number (UUID version-4)
        // For details see: https://en.wikipedia.org/wiki/Universally_unique_identifier
        //
        return UUID.randomUUID().toString();
    }
}









