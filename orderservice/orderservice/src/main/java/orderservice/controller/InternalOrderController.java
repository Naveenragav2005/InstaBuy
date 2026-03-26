package orderservice.controller;

import orderservice.model.OrderStatus;
import orderservice.service.OrderService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/orders")
public class InternalOrderController {

    private final OrderService orderService;

    public InternalOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PutMapping("/{orderId}/status")
    public String updateStatus(@PathVariable Long orderId, @RequestParam OrderStatus status) {
        orderService.updateOrderStatus(orderId, status);
        return "Internal order status updated to " + status;
    }
}
