package orderservice.controller;

import orderservice.DTO.OrderRequestDTO;
import orderservice.DTO.OrderResponseDTO;
import orderservice.service.OrderService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/place")
    public OrderResponseDTO placeOrder(@RequestBody OrderRequestDTO request){

        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        return orderService.placeOrder(request, userId);
    }
}