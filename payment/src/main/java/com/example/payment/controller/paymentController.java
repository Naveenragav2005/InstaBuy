package com.example.payment.controller;

import com.example.payment.service.paymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payment")
public class paymentController {

    private final paymentService paymentService;

    public paymentController(paymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/pay")
    public String pay(@RequestParam Long orderId,
                      @RequestParam Long userId,
                      @RequestParam Double amount,
                      HttpServletRequest request) {

        String token = request.getHeader("Authorization");

        return paymentService.processPayment(orderId, userId, amount, token);
    }
}