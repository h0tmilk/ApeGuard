const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustedAddressesRegistry contract", function () {

  let TrustedAddressesRegistry;
  let owner;
  let trustedAddress1;
  let trustedAddress2;
  let trustedAddress3;
  let trustedAddress4;
  let trustedAddress5;

  before(async function() {
    this.TrustedAddressesRegistryContract = await ethers.getContractFactory("TrustedAddressesRegistry");
    [owner, trustedAddress1, trustedAddress2, trustedAddress3, trustedAddress4, trustedAddress5] = await ethers.getSigners();
  });

  beforeEach(async function () {
    this.trustedAddressesRegistry = await this.TrustedAddressesRegistryContract.deploy();
    await this.trustedAddressesRegistry.deployed();
  });

  describe("Expected use-cases", function () {
    it("Should have 0 trustedAddresses after deployment", async function() {
      expect((await this.trustedAddressesRegistry.size()).toString()).to.equal('0');
    });

    it("Should not contain trustedAddress1", async function() {
      expect(await this.trustedAddressesRegistry.contains(trustedAddress1.address)).to.be.false;
    });

    it("Should add 2 trustedAddresses", async function() {
      await this.trustedAddressesRegistry.add(trustedAddress1.address);
      expect(await this.trustedAddressesRegistry.contains(trustedAddress1.address)).to.be.true;
      expect((await this.trustedAddressesRegistry.size()).toString()).to.equal('1');

      await this.trustedAddressesRegistry.add(trustedAddress2.address);
      expect(await this.trustedAddressesRegistry.contains(trustedAddress2.address)).to.be.true;
      expect((await this.trustedAddressesRegistry.size()).toString()).to.equal('2');
    });

    it("Should remove 2 trustedAddresses", async function() {
      await this.trustedAddressesRegistry.add(trustedAddress1.address);
      await this.trustedAddressesRegistry.add(trustedAddress2.address);
      await this.trustedAddressesRegistry.add(trustedAddress3.address);
      await this.trustedAddressesRegistry.add(trustedAddress4.address);

      await this.trustedAddressesRegistry.remove(trustedAddress3.address);
      await this.trustedAddressesRegistry.remove(trustedAddress1.address);

      expect(await this.trustedAddressesRegistry.contains(trustedAddress3.address)).to.be.false;
      expect(await this.trustedAddressesRegistry.contains(trustedAddress1.address)).to.be.false;
      expect((await this.trustedAddressesRegistry.size()).toString()).to.equal('2');
    });

    it("Should not allow to remove unexisting address", async function() {
      await expect(this.trustedAddressesRegistry.remove(trustedAddress1.address)).to.be.revertedWith("trustedAddressAddress must be present in map");
    });

    it("Should match mapping indexes with list indexes", async function() {
      // Add trustedAddresses
      await this.trustedAddressesRegistry.add(trustedAddress1.address);
      await this.trustedAddressesRegistry.add(trustedAddress2.address);
      await this.trustedAddressesRegistry.add(trustedAddress3.address);
      await this.trustedAddressesRegistry.add(trustedAddress4.address);

      let trustedAddress1AddressMappingIndex;
      let trustedAddress2AddressMappingIndex;
      let trustedAddress3AddressMappingIndex;
      let trustedAddress4AddressMappingIndex;

      // Get registered indexes in mapping for each address
      [trustedAddress1AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress1.address);
      [trustedAddress2AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress2.address);
      [trustedAddress3AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress3.address);
      [trustedAddress4AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress4.address);

      // Get from the list the address stored at the mapping stored index
      let trustedAddress1ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress1AddressMappingIndex);
      let trustedAddress2ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress2AddressMappingIndex);
      let trustedAddress3ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress3AddressMappingIndex);
      let trustedAddress4ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress4AddressMappingIndex);

      // Chexk if addresses are matching between list an mapping
      expect(trustedAddress1ListIndex.toString()).to.be.equal(trustedAddress1.address.toString());
      expect(trustedAddress2ListIndex.toString()).to.be.equal(trustedAddress2.address.toString());
      expect(trustedAddress3ListIndex.toString()).to.be.equal(trustedAddress3.address.toString());
      expect(trustedAddress4ListIndex.toString()).to.be.equal(trustedAddress4.address.toString());

      // Remove some trustedAddress
      await this.trustedAddressesRegistry.remove(trustedAddress3.address);
      await this.trustedAddressesRegistry.remove(trustedAddress1.address);

      // Same tests again
      [trustedAddress2AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress2.address);
      [trustedAddress4AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress4.address);
      trustedAddress2ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress2AddressMappingIndex);
      trustedAddress4ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress4AddressMappingIndex);
      expect(trustedAddress2ListIndex.toString()).to.be.equal(trustedAddress2.address.toString());
      expect(trustedAddress4ListIndex.toString()).to.be.equal(trustedAddress4.address.toString());

      // Add a new trustedAddress and add previously removed trustedAddress3 again
      await this.trustedAddressesRegistry.add(trustedAddress5.address);
      await this.trustedAddressesRegistry.add(trustedAddress3.address);

      let trustedAddress5AddressMappingIndex;

      // Same tests
      [trustedAddress3AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress3.address);
      [trustedAddress5AddressMappingIndex] = await this.trustedAddressesRegistry.getTrustedAddressId(trustedAddress5.address);
      trustedAddress3ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress3AddressMappingIndex);
      trustedAddress5ListIndex = await this.trustedAddressesRegistry.getByIndex(trustedAddress5AddressMappingIndex);

      expect(trustedAddress3ListIndex.toString()).to.be.equal(trustedAddress3.address.toString());
      expect(trustedAddress5ListIndex.toString()).to.be.equal(trustedAddress5.address.toString());
    });
  });

  describe("Authorizations", function () {
    it("Should allow only owner to add trustedAddress", async function() {
      await expect(
        this.trustedAddressesRegistry.connect(trustedAddress1).add(trustedAddress1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow only owner to delete trustedAddress", async function() {
      await this.trustedAddressesRegistry.add(trustedAddress1.address);
      await expect(
        this.trustedAddressesRegistry.connect(trustedAddress1).remove(trustedAddress1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
