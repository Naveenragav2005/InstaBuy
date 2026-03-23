package orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "inventory", url = "http://localhost:8083")
public interface InventoryClient {

    @GetMapping("/inventory/check")
    boolean checkStock(
            @RequestParam Long productCode,
            @RequestParam int quantity
    );

    @PostMapping("/inventory/reduce")
    String reduceStock(
            @RequestParam Long productCode,
            @RequestParam int quantity
    );
}