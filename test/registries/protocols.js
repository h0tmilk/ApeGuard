const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProtocolRegistry contract", function () {

  let protocol1;
  let protocol2;
  let protocol3;
  let protocol4;
  let protocol5;

  before(async function() {
    this.ProtocolsRegistryContract = await ethers.getContractFactory("ProtocolsRegistry");
    protocol1 = "AAVE";
    protocol2 = "UniSwap";
    protocol3 = "Compound";
    protocol4 = "SushiSwap";
    protocol5 = "ParaSwap";
  });

  beforeEach(async function () {
    [owner, account1] = await ethers.getSigners();

    this.protocolsRegistry = await this.ProtocolsRegistryContract.deploy();
    await this.protocolsRegistry.deployed();
  });

  describe("Expected use-cases", function () {
    it("Should have 0 protocols after deployment", async function() {
      expect((await this.protocolsRegistry.size()).toString()).to.equal('0');
    });

    it("Should not contain protocol1", async function() {
      expect(await this.protocolsRegistry.contains(protocol1)).to.be.false;
    });

    it("Should add 2 protocols", async function() {
      await this.protocolsRegistry.add(protocol1);
      expect(await this.protocolsRegistry.contains(protocol1)).to.be.true;
      expect((await this.protocolsRegistry.size()).toString()).to.equal('1');

      await this.protocolsRegistry.add(protocol2);
      expect(await this.protocolsRegistry.contains(protocol2)).to.be.true;
      expect((await this.protocolsRegistry.size()).toString()).to.equal('2');
    });

    it("Should shouldn't add a protocol with same name (case insensitive)", async function() {
      await this.protocolsRegistry.add(protocol1);
      expect(await this.protocolsRegistry.contains(protocol1)).to.be.true;
      expect((await this.protocolsRegistry.size()).toString()).to.equal('1');

      await expect(this.protocolsRegistry.add("aave")).to.be.revertedWith("protocolName (case insensitive) already in map");
      expect((await this.protocolsRegistry.size()).toString()).to.equal('1');
    });

    it("Should should return true when containing protocol (case insensitive)", async function() {
      await this.protocolsRegistry.add(protocol1);
      expect(await this.protocolsRegistry.contains("aave")).to.be.true;
      expect(await this.protocolsRegistry.contains("aAve")).to.be.true;
      expect(await this.protocolsRegistry.contains("aAvE")).to.be.true;
    });

    it("Should remove 2 protocols", async function() {
      await this.protocolsRegistry.add(protocol1);
      await this.protocolsRegistry.add(protocol2);
      await this.protocolsRegistry.add(protocol3);
      await this.protocolsRegistry.add(protocol4);

      await this.protocolsRegistry.remove(protocol3);
      await this.protocolsRegistry.remove(protocol1);

      expect(await this.protocolsRegistry.contains(protocol3)).to.be.false;
      expect(await this.protocolsRegistry.contains(protocol1)).to.be.false;
      expect((await this.protocolsRegistry.size()).toString()).to.equal('2');
    });

    it("Should not allow to remove unexisting protocol", async function() {
      await expect(this.protocolsRegistry.remove(protocol1)).to.be.revertedWith("protocolName (case insensitive) must be present in map");
    });

    it("Should match mapping indexes with list indexes", async function() {
      // Add protocols
      await this.protocolsRegistry.add(protocol1);
      await this.protocolsRegistry.add(protocol2);
      await this.protocolsRegistry.add(protocol3);
      await this.protocolsRegistry.add(protocol4);

      let protocol1AddressMappingIndex;
      let protocol2AddressMappingIndex;
      let protocol3AddressMappingIndex;
      let protocol4AddressMappingIndex;

      // Get registered indexes in mapping for each address
      protocol1AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol1);
      protocol2AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol2);
      protocol3AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol3);
      protocol4AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol4);

      // Get from the list the address stored at the mapping stored index
      let protocol1ListIndex = await this.protocolsRegistry.getByIndex(protocol1AddressMappingIndex);
      let protocol2ListIndex = await this.protocolsRegistry.getByIndex(protocol2AddressMappingIndex);
      let protocol3ListIndex = await this.protocolsRegistry.getByIndex(protocol3AddressMappingIndex);
      let protocol4ListIndex = await this.protocolsRegistry.getByIndex(protocol4AddressMappingIndex);

      // Chexk if addresses are matching between list an mapping
      expect(protocol1ListIndex.toString()).to.be.equal(protocol1.toString());
      expect(protocol2ListIndex.toString()).to.be.equal(protocol2.toString());
      expect(protocol3ListIndex.toString()).to.be.equal(protocol3.toString());
      expect(protocol4ListIndex.toString()).to.be.equal(protocol4.toString());

      // Remove some protocol
      await this.protocolsRegistry.remove(protocol3);
      await this.protocolsRegistry.remove(protocol1);

      // Same tests again
      protocol2AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol2);
      protocol4AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol4);
      protocol2ListIndex = await this.protocolsRegistry.getByIndex(protocol2AddressMappingIndex);
      protocol4ListIndex = await this.protocolsRegistry.getByIndex(protocol4AddressMappingIndex);
      expect(protocol2ListIndex.toString()).to.be.equal(protocol2.toString());
      expect(protocol4ListIndex.toString()).to.be.equal(protocol4.toString());

      // Add a new protocol and add previously removed protocol3 again
      await this.protocolsRegistry.add(protocol5);
      await this.protocolsRegistry.add(protocol3);

      let protocol5AddressMappingIndex;

      // Same tests
      protocol3AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol3);
      protocol5AddressMappingIndex = await this.protocolsRegistry.getProtocolId(protocol5);
      protocol3ListIndex = await this.protocolsRegistry.getByIndex(protocol3AddressMappingIndex);
      protocol5ListIndex = await this.protocolsRegistry.getByIndex(protocol5AddressMappingIndex);

      expect(protocol3ListIndex.toString()).to.be.equal(protocol3.toString());
      expect(protocol5ListIndex.toString()).to.be.equal(protocol5.toString());
    });
  });

  describe("Authorizations", function () {
    it("Should allow only owner to add protocol", async function() {
      await expect(
        this.protocolsRegistry.connect(account1).add(protocol1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow only owner to delete protocol", async function() {
      await this.protocolsRegistry.add(protocol1);
      await expect(
        this.protocolsRegistry.connect(account1).remove(protocol1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
