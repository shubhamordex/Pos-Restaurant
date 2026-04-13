package com.Posres.Propos.service;

import com.Posres.Propos.entity.Restaurant;
import com.Posres.Propos.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RestaurantService {
    
    private final RestaurantRepository restaurantRepository;
    
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }
    
    public Optional<Restaurant> getRestaurantBySlug(String slug) {
        return restaurantRepository.findBySlug(slug);
    }
    
    public Optional<Restaurant> getRestaurantById(Long id) {
        return restaurantRepository.findById(id);
    }
    
    @Transactional
    public Restaurant createRestaurant(Restaurant restaurant) {
        if (restaurantRepository.existsBySlug(restaurant.getSlug())) {
            throw new RuntimeException("Restaurant with slug '" + restaurant.getSlug() + "' already exists");
        }
        return restaurantRepository.save(restaurant);
    }
    
    @Transactional
    public Restaurant updateRestaurant(Long id, Restaurant restaurantDetails) {
        Restaurant restaurant = restaurantRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Restaurant not found with id: " + id));
        
        restaurant.setName(restaurantDetails.getName());
        restaurant.setCountry(restaurantDetails.getCountry());
        restaurant.setCurrency(restaurantDetails.getCurrency());
        restaurant.setCurrencySymbol(restaurantDetails.getCurrencySymbol());
        
        return restaurantRepository.save(restaurant);
    }
    
    @Transactional
    public void deleteRestaurant(Long id) {
        restaurantRepository.deleteById(id);
    }
}
