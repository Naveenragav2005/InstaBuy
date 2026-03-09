package orderservice.service;

import orderservice.DTO.OrderRequestDTO;
import orderservice.DTO.OrderResponseDTO;

import java.util.List;

public interface OrderService {
    OrderResponseDTO placeOrder(OrderRequestDTO request, Long userId);

    List<OrderResponseDTO> getUserOrders(Long userId);

    void cancelOrder(Long orderId);
}
