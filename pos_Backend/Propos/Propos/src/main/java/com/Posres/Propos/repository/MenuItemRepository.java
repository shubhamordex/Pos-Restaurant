package com.Posres.Propos.repository;

import com.Posres.Propos.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRestaurantId(Long restaurantId);
    List<MenuItem> findByCategoryId(Long categoryId);
    List<MenuItem> findByRestaurantIdAndIsAvailableTrue(Long restaurantId);
}
