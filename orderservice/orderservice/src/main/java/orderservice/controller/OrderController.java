package orderservice.controller;

import orderservice.DTO.OrderRequestDTO;
import orderservice.DTO.OrderResponseDTO;
import orderservice.service.OrderService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/place")
    public OrderResponseDTO placeOrder(@RequestBody OrderRequestDTO request) {

        Long userId = (Long) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return orderService.placeOrder(request, userId);
    }

    @GetMapping("/{orderId}")
    public OrderResponseDTO getOrderDetails(@PathVariable Long orderId) {

        Long userId = (Long) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return orderService.getOrderDetails(orderId, userId);
    }

    @PutMapping("/{orderId}/cancel")
    public String cancelOrder(@PathVariable Long orderId) {

        Long userId = (Long) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return orderService.cancelOrder(orderId, userId);
    }

    // 3️⃣ Track Order Status
    @GetMapping("/{orderId}/status")
    public String trackStatus(@PathVariable Long orderId) {

        Long userId = (Long) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return orderService.getOrderStatus(orderId, userId);
    }
}
