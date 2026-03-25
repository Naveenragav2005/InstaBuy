package com.example.payment.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class to initialize the RazorpayClient bean.
 * Credentials are loaded from environment variables via application.yml.
 */
@Configuration
public class RazorpayConfig {

    private static final Logger log = LoggerFactory.getLogger(RazorpayConfig.class);

    @Value("${razorpay.key}")
    private String razorpayKey;

    @Value("${razorpay.secret}")
    private String razorpaySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        log.info("Initializing RazorpayClient with key: {}****", razorpayKey.substring(0, Math.min(8, razorpayKey.length())));
        return new RazorpayClient(razorpayKey, razorpaySecret);
    }

    /**
     * Expose the secret for webhook signature verification.
     */
    public String getRazorpaySecret() {
        return razorpaySecret;
    }
}
