package orderservice.service;

import orderservice.DTO.OrderRequestDTO;
import orderservice.DTO.OrderResponseDTO;
import orderservice.model.OrderStatus;

import java.util.List;

public interface OrderService {
    <Order> OrderResponseDTO placeOrder(OrderRequestDTO request, Long userId);

    List<OrderResponseDTO> getUserOrders(Long userId);

    void cancelOrder(Long orderId);

    OrderResponseDTO getOrderDetails(Long orderId, Long userId);

    String cancelOrder(Long orderId, Long userId);

    String getOrderStatus(Long orderId, Long userId);

    List<OrderResponseDTO> getAllOrders();

    String updateOrderStatus(Long orderId, OrderStatus status);
}
