const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AddressesRegistry contract", function () {

  before(async function() {
    this.AddressesRegistryContract = await ethers.getContractFactory("AddressesRegistry");
    [owner, address1, address2, address3, address4, address5] = await ethers.getSigners();
  });

  beforeEach(async function () {
    this.addressesRegistry = await this.AddressesRegistryContract.deploy();
    await this.addressesRegistry.deployed();
  });

  describe("Expected use-cases", function () {
    it("Should have 0 addresses after deployment", async function() {
      expect((await this.addressesRegistry.size()).toString()).to.equal('0');
    });

    it("Should not contain address1", async function() {
      expect(await this.addressesRegistry.contains(address1.address)).to.be.false;
    });

    it("Should add 2 addresses", async function() {
      await this.addressesRegistry.add(address1.address);
      expect(await this.addressesRegistry.contains(address1.address)).to.be.true;
      expect((await this.addressesRegistry.size()).toString()).to.equal('1');

      await this.addressesRegistry.add(address2.address);
      expect(await this.addressesRegistry.contains(address2.address)).to.be.true;
      expect((await this.addressesRegistry.size()).toString()).to.equal('2');
    });

    it("Should remove 2 addresses", async function() {
      await this.addressesRegistry.add(address1.address);
      await this.addressesRegistry.add(address2.address);
      await this.addressesRegistry.add(address3.address);
      await this.addressesRegistry.add(address4.address);

      await this.addressesRegistry.remove(address3.address);
      await this.addressesRegistry.remove(address1.address);

      expect(await this.addressesRegistry.contains(address3.address)).to.be.false;
      expect(await this.addressesRegistry.contains(address1.address)).to.be.false;
      expect((await this.addressesRegistry.size()).toString()).to.equal('2');
    });

    it("Should not allow to remove unexisting address", async function() {
      await expect(this.addressesRegistry.remove(address1.address)).to.be.revertedWith("address must be present in map");
    });

    it("Should match mapping indexes with list indexes", async function() {
      // Add addresses
      await this.addressesRegistry.add(address1.address);
      await this.addressesRegistry.add(address2.address);
      await this.addressesRegistry.add(address3.address);
      await this.addressesRegistry.add(address4.address);

      let address1AddressMappingIndex;
      let address2AddressMappingIndex;
      let address3AddressMappingIndex;
      let address4AddressMappingIndex;

      // Get registered indexes in mapping for each address
      [address1AddressMappingIndex] = await this.addressesRegistry.getAddressId(address1.address);
      [address2AddressMappingIndex] = await this.addressesRegistry.getAddressId(address2.address);
      [address3AddressMappingIndex] = await this.addressesRegistry.getAddressId(address3.address);
      [address4AddressMappingIndex] = await this.addressesRegistry.getAddressId(address4.address);

      // Get from the list the address stored at the mapping stored index
      let address1ListIndex = await this.addressesRegistry.getByIndex(address1AddressMappingIndex);
      let address2ListIndex = await this.addressesRegistry.getByIndex(address2AddressMappingIndex);
      let address3ListIndex = await this.addressesRegistry.getByIndex(address3AddressMappingIndex);
      let address4ListIndex = await this.addressesRegistry.getByIndex(address4AddressMappingIndex);

      // Chexk if addresses are matching between list an mapping
      expect(address1ListIndex.toString()).to.be.equal(address1.address.toString());
      expect(address2ListIndex.toString()).to.be.equal(address2.address.toString());
      expect(address3ListIndex.toString()).to.be.equal(address3.address.toString());
      expect(address4ListIndex.toString()).to.be.equal(address4.address.toString());

      // Remove some address
      await this.addressesRegistry.remove(address3.address);
      await this.addressesRegistry.remove(address1.address);

      // Same tests again
      [address2AddressMappingIndex] = await this.addressesRegistry.getAddressId(address2.address);
      [address4AddressMappingIndex] = await this.addressesRegistry.getAddressId(address4.address);
      address2ListIndex = await this.addressesRegistry.getByIndex(address2AddressMappingIndex);
      address4ListIndex = await this.addressesRegistry.getByIndex(address4AddressMappingIndex);
      expect(address2ListIndex.toString()).to.be.equal(address2.address.toString());
      expect(address4ListIndex.toString()).to.be.equal(address4.address.toString());

      // Add a new address and add previously removed address3 again
      await this.addressesRegistry.add(address5.address);
      await this.addressesRegistry.add(address3.address);

      let address5AddressMappingIndex;

      // Same tests
      [address3AddressMappingIndex] = await this.addressesRegistry.getAddressId(address3.address);
      [address5AddressMappingIndex] = await this.addressesRegistry.getAddressId(address5.address);
      address3ListIndex = await this.addressesRegistry.getByIndex(address3AddressMappingIndex);
      address5ListIndex = await this.addressesRegistry.getByIndex(address5AddressMappingIndex);

      expect(address3ListIndex.toString()).to.be.equal(address3.address.toString());
      expect(address5ListIndex.toString()).to.be.equal(address5.address.toString());
    });
  });

  describe("Authorizations", function () {
    it("Should allow only owner to add address", async function() {
      await expect(
        this.addressesRegistry.connect(address1).add(address1.address)
      ).to.be.revertedWith("Caller is not allowed");
    });

    it("Should allow only owner to delete address", async function() {
      await this.addressesRegistry.add(address1.address);
      await expect(
        this.addressesRegistry.connect(address1).remove(address1.address)
      ).to.be.revertedWith("Caller is not allowed");
    });
  });
});