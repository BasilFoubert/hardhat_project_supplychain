const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

//TRANSPORT
describe("Transport", function () {
    let Transport, transport;

    beforeEach(async () => {
        const ImplV1 = await ethers.getContractFactory("ImplementationV1");
        const proxy = await upgrades.deployProxy(ImplV1, [], { initializer: "initialize" });
        const implAddress = await proxy.getAddress();

        // Grant TRANSPORTEUR_ROLE to the sender
        const [sender] = await ethers.getSigners();
        const TRANSPORTEUR_ROLE = await proxy.TRANSPORTEUR_ROLE();
        await proxy.accorderRole(sender.address, TRANSPORTEUR_ROLE);

        Transport = await ethers.getContractFactory("Transport");
        transport = await upgrades.deployProxy(Transport, [implAddress], {
            initializer: "initialize",
        });
        await transport.waitForDeployment();
    });

    it("enregistre un transport correctement", async () => {
        const [sender, receiver] = await ethers.getSigners();
        const temp = 5;
        const dateLivraison = Math.floor(Date.now() / 1000);
    
        const tx = await transport.enregistrerTransport(
            sender.address,
            receiver.address,
            temp,
            dateLivraison
        );
        await tx.wait();
    
        const result = await transport.getTransport(0);
        expect(result.envoyeur).to.equal(sender.address);
        expect(result.recepteur).to.equal(receiver.address);
        expect(result.temperatureTransport).to.equal(temp);
        expect(result.dateLivraison).to.equal(dateLivraison);
        expect(result.dateReception).to.be.gt(0);
    });

    it("renvoie le bon nombre de transports", async () => {
        const [a1, a2] = await ethers.getSigners();
        await transport.enregistrerTransport(a1.address, a2.address, 3, 100000);
        await transport.enregistrerTransport(a2.address, a1.address, 7, 200000);
    
        const count = await transport.getNombreTransports();
        expect(count).to.equal(2);
        });
});