package inventory.service;

import inventory.model.Product;
import inventory.repo.ProductRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    private final ProductRepo productRepo;

    public InventoryService(ProductRepo productRepo) {
        this.productRepo = productRepo;
    }

    public Product addProduct(Product product){
        return productRepo.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepo.findAll();
    }

    public Product updateProduct(Long productCode, Product updatedProduct) {
        Product existingProduct = productRepo.findById(productCode)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (updatedProduct.getName() != null) existingProduct.setName(updatedProduct.getName());
        if (updatedProduct.getDescription() != null) existingProduct.setDescription(updatedProduct.getDescription());
        if (updatedProduct.getImageUrl() != null) existingProduct.setImageUrl(updatedProduct.getImageUrl());
        if (updatedProduct.getPrice() != null) existingProduct.setPrice(updatedProduct.getPrice());
        if (updatedProduct.getStock() != null) existingProduct.setStock(updatedProduct.getStock());

        return productRepo.save(existingProduct);
    }

    public Product updateStock(Long productCode, int stock) {

        Product product = productRepo.findById(productCode)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setStock(stock);

        return productRepo.save(product);
    }

    public void deleteProduct(Long productCode) {
        productRepo.deleteById(productCode);
    }

    // Check stock (used by Order Service)
    public boolean checkStock(Long productCode, int quantity) {

        Product product = productRepo.findById(productCode)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        return product.getStock() >= quantity;
    }

    // Reduce stock after order
    public void reduceStock(Long productCode, int quantity) {

        Product product = productRepo.findById(productCode)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int newStock = product.getStock() - quantity;
        if (newStock < 0) {
            newStock = 0;
        }
        product.setStock(newStock);

        productRepo.save(product);
    }

}