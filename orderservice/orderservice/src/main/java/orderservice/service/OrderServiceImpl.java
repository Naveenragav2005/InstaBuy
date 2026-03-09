package orderservice.service;

import orderservice.DTO.OrderRequestDTO;
import orderservice.DTO.OrderResponseDTO;
import orderservice.model.Order;
import orderservice.model.OrderStatus;
import orderservice.model.User;
import orderservice.orderRepo.OrderRepo;
import orderservice.orderRepo.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepo orderRepo;
    private final UserRepo userRepo;

    public OrderServiceImpl(OrderRepo orderRepo, UserRepo userRepo) {
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
    }

    @Override
    public OrderResponseDTO placeOrder(OrderRequestDTO request, Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setProductCode(request.getProductCode());
        order.setQuantity(request.getQuantity());
        order.setUser(user); // set the User object
        order.setStatus(OrderStatus.PENDING);

        Order saved = orderRepo.save(order);

        OrderResponseDTO response = new OrderResponseDTO();
        response.setOrderId(saved.getId());
        response.setProductCode(saved.getProductCode());
        response.setQuantity(saved.getQuantity());
        response.setStatus(saved.getStatus().name());

        return response;
    }

    @Override
    public List<OrderResponseDTO> getUserOrders(Long userId) {
        List<Order> orders = orderRepo.findByUserId(userId);

        return orders.stream().map(order -> {
            OrderResponseDTO dto = new OrderResponseDTO();
            dto.setOrderId(order.getId());
            dto.setProductCode(order.getProductCode());
            dto.setQuantity(order.getQuantity());
            dto.setStatus(order.getStatus().name());
            return dto;
        }).toList();
    }

    @Override
    public void cancelOrder(Long orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(OrderStatus.CANCELLED);
        orderRepo.save(order);
    }
}
