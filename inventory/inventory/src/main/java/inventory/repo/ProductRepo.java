package inventory.repo;

import inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepo extends JpaRepository<Product, Long> {

    Product findByProductCode(Long productCode);

}