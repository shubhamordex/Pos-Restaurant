package com.Posres.Propos.service;

import com.Posres.Propos.entity.Order;
import com.Posres.Propos.entity.OrderItem;
import com.Posres.Propos.entity.Restaurant;
import com.Posres.Propos.repository.OrderRepository;
import com.Posres.Propos.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    
    public List<Order> getOrdersByRestaurantId(Long restaurantId) {
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
    }
    
    public List<Order> getOrdersByRestaurantIdAndStatus(Long restaurantId, Order.OrderStatus status) {
        return orderRepository.findByRestaurantIdAndStatusOrderByCreatedAtDesc(restaurantId, status);
    }
    
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }
    
    public Order getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new RuntimeException("Order not found with order number: " + orderNumber));
    }
    
    @Transactional
    public Order createOrder(Long restaurantId, Order order) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow(() -> new RuntimeException("Restaurant not found with id: " + restaurantId));
        
        order.setRestaurant(restaurant);
        order.setOrderNumber(generateOrderNumber());
        
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem item : order.getOrderItems()) {
            BigDecimal itemTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setTotalPrice(itemTotal);
            item.setOrder(order);
            subtotal = subtotal.add(itemTotal);
        }
        
        order.setSubtotal(subtotal);
        order.setTotal(order.getTax() != null ? subtotal.add(order.getTax()) : subtotal);
        
        return orderRepository.save(order);
    }
    
    @Transactional
    public Order updateOrderStatus(Long id, Order.OrderStatus status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        return orderRepository.save(order);
    }
    
    @Transactional
    public Order updateOrder(Long id, Order orderDetails) {
        Order order = getOrderById(id);
        order.setStatus(orderDetails.getStatus());
        order.setPaymentMethod(orderDetails.getPaymentMethod());
        order.setCustomerName(orderDetails.getCustomerName());
        order.setCustomerPhone(orderDetails.getCustomerPhone());
        order.setTableNumber(orderDetails.getTableNumber());
        order.setNotes(orderDetails.getNotes());
        return orderRepository.save(order);
    }
    
    @Transactional
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
    
    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "ORD-" + timestamp + "-" + uuid;
    }
}
