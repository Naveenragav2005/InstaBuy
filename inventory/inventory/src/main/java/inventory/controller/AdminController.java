package inventory.controller;


import inventory.model.Product;
import inventory.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")

public class AdminController {

    private InventoryService inventoryService;
    public AdminController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }


    @PostMapping("/add")
    public Product addProduct(@RequestBody Product product) {
        return inventoryService.addProduct(product);
    }


    @GetMapping("/all")
    public List<Product> getAllProducts() {
        return inventoryService.getAllProducts();
    }


    @PutMapping("/products/{productCode}/stock")
    public Product updateStock(
            @PathVariable Long productCode,
            @RequestParam int stock) {

        return inventoryService.updateStock(productCode, stock);
    }


    @DeleteMapping("/delete/{productCode}")
    public String deleteProduct(@PathVariable Long productCode) {

        inventoryService.deleteProduct(productCode);

        return "Product deleted";
    }
}
