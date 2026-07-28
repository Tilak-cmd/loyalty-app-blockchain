// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoyalToken is ERC20, Ownable {
    address public merchant;

    constructor(
        string memory name,
        string memory symbol,
        address _merchant,
        address _owner
    ) ERC20(name, symbol) Ownable(_owner) {
        merchant = _merchant;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // NEW: Allow platform (owner) to burn from any account (for redemptions)
    function burnFrom(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
}
