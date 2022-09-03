package com.Yannie.springbootecommerce.dto;

import com.Yannie.springbootecommerce.entity.Address;
import com.Yannie.springbootecommerce.entity.Customer;
import com.Yannie.springbootecommerce.entity.Order;
import com.Yannie.springbootecommerce.entity.OrderItem;
import lombok.Data;

import java.util.Set;

@Data
public class Purchase {

    private Customer customer;
    private Address shippingAddress;
    private Address billingAddress;
    private Order order;
    private Set<OrderItem> orderItems;

}
