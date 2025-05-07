

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ImplementationV1.sol";

contract ImplementationV2 is ImplementationV1 {
    function version() public pure returns (string memory) {
        return "V2";
    }

    // Optionnel : tu peux aussi ajouter une logique modifiée
    function incrementValue() public onlyOwner {
        setValue(getValue() + 1);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}