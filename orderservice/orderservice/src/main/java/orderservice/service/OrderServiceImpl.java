package orderservice.service;

import orderservice.DTO.OrderRequestDTO;
import orderservice.DTO.OrderResponseDTO;
import orderservice.client.InventoryClient;
import orderservice.model.Order;
import orderservice.model.OrderStatus;
import orderservice.orderRepo.OrderRepo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepo orderRepo;
    private final InventoryClient inventoryClient;

    public OrderServiceImpl(OrderRepo orderRepo, InventoryClient inventoryClient) {
        this.orderRepo = orderRepo;
        this.inventoryClient = inventoryClient;
    }

    @Override
    public OrderResponseDTO placeOrder(OrderRequestDTO request, Long userId) {

        boolean inStock = inventoryClient.checkStock(
                request.getProductCode(),
                request.getQuantity()
        );

        if (!inStock) {
            throw new RuntimeException("Product out of stock");
        }

        inventoryClient.reduceStock(
                request.getProductCode(),
                request.getQuantity()
        );

        Order order = new Order();
        order.setUserId(userId);
        order.setProductCode(request.getProductCode());
        order.setQuantity(request.getQuantity());
        order.setStatus(OrderStatus.PENDING);

        Order saved = orderRepo.save(order);

        return convertToDTO(saved);
    }

    @Override
    public List<OrderResponseDTO> getUserOrders(Long userId) {

        List<Order> orders = orderRepo.findByUserId(userId);

        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void cancelOrder(Long orderId) {

    }

    @Override
    public String cancelOrder(Long orderId, Long userId) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }

        if (order.getStatus() == OrderStatus.SHIPPED ||
                order.getStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Order cannot be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);

        orderRepo.save(order);

        return "Order cancelled successfully";
    }

    @Override
    public OrderResponseDTO getOrderDetails(Long orderId, Long userId) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }

        return convertToDTO(order);
    }

    @Override
    public String getOrderStatus(Long orderId, Long userId) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }

        return order.getStatus().name();
    }

    @Override
    public List<OrderResponseDTO> getAllOrders() {

        return orderRepo.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public String updateOrderStatus(Long orderId, OrderStatus status) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status);

        orderRepo.save(order);

        return "Order status updated to " + status;
    }

    private OrderResponseDTO convertToDTO(Order order) {

        OrderResponseDTO dto = new OrderResponseDTO();

        dto.setOrderId(order.getId());
        dto.setProductCode(order.getProductCode());
        dto.setQuantity(order.getQuantity());
        dto.setStatus(order.getStatus().name());

        return dto;
    }
}