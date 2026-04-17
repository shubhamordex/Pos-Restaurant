package com.example.pos.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "bill")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "pos_order_id")
    private PosOrder posOrder;

    private BigDecimal totalAmount;
    private BigDecimal tax;
    private BigDecimal serviceCharge;
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    public enum PaymentStatus {
        UNPAID, PAID, REFUNDED
    }
}
