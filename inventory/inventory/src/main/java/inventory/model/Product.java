package inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    private Long productCode;

    private Integer stock;

    private Double price;

    public Long getProductCode() { return productCode; }
    public void setProductCode(Long productCode) { this.productCode = productCode; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}