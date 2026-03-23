package com.example.payment.repo;

import com.example.payment.model.payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface paymentRepo extends JpaRepository<payment, Long> {
}