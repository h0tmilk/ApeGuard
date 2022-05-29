const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ExecutorsRegistry contract", function () {

  let ExecutorsRegistry;
  let owner;
  let executor1;
  let executor2;
  let executor3;
  let executor4;
  let executor5;

  before(async function() {
    this.ExecutorsRegistryContract = await ethers.getContractFactory("ExecutorsRegistry");
    [owner, executor1, executor2, executor3, executor4, executor5] = await ethers.getSigners();
  });

  beforeEach(async function () {
    this.executorsRegistry = await this.ExecutorsRegistryContract.deploy();
    await this.executorsRegistry.deployed();
  });

  describe("Expected use-cases", function () {
    it("Should have 0 executors after deployment", async function() {
      expect((await this.executorsRegistry.size()).toString()).to.equal('0');
    });

    it("Should not contain executor1", async function() {
      expect(await this.executorsRegistry.contains(executor1.address)).to.be.false;
    });

    it("Should add 2 executors", async function() {
      await this.executorsRegistry.add(executor1.address);
      expect(await this.executorsRegistry.contains(executor1.address)).to.be.true;
      expect((await this.executorsRegistry.size()).toString()).to.equal('1');

      await this.executorsRegistry.add(executor2.address);
      expect(await this.executorsRegistry.contains(executor2.address)).to.be.true;
      expect((await this.executorsRegistry.size()).toString()).to.equal('2');
    });

    it("Should remove 2 executors", async function() {
      await this.executorsRegistry.add(executor1.address);
      await this.executorsRegistry.add(executor2.address);
      await this.executorsRegistry.add(executor3.address);
      await this.executorsRegistry.add(executor4.address);

      await this.executorsRegistry.remove(executor3.address);
      await this.executorsRegistry.remove(executor1.address);

      expect(await this.executorsRegistry.contains(executor3.address)).to.be.false;
      expect(await this.executorsRegistry.contains(executor1.address)).to.be.false;
      expect((await this.executorsRegistry.size()).toString()).to.equal('2');
    });

    it("Should not allow to remove unexisting address", async function() {
      await expect(this.executorsRegistry.remove(executor1.address)).to.be.revertedWith("executorAddress must be present in map");
    });

    it("Should match mapping indexes with list indexes", async function() {
      // Add executors
      await this.executorsRegistry.add(executor1.address);
      await this.executorsRegistry.add(executor2.address);
      await this.executorsRegistry.add(executor3.address);
      await this.executorsRegistry.add(executor4.address);

      let executor1AddressMappingIndex;
      let executor2AddressMappingIndex;
      let executor3AddressMappingIndex;
      let executor4AddressMappingIndex;

      // Get registered indexes in mapping for each address
      [executor1AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor1.address);
      [executor2AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor2.address);
      [executor3AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor3.address);
      [executor4AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor4.address);

      // Get from the list the address stored at the mapping stored index
      let executor1ListIndex = await this.executorsRegistry.getByIndex(executor1AddressMappingIndex);
      let executor2ListIndex = await this.executorsRegistry.getByIndex(executor2AddressMappingIndex);
      let executor3ListIndex = await this.executorsRegistry.getByIndex(executor3AddressMappingIndex);
      let executor4ListIndex = await this.executorsRegistry.getByIndex(executor4AddressMappingIndex);

      // Chexk if addresses are matching between list an mapping
      expect(executor1ListIndex.toString()).to.be.equal(executor1.address.toString());
      expect(executor2ListIndex.toString()).to.be.equal(executor2.address.toString());
      expect(executor3ListIndex.toString()).to.be.equal(executor3.address.toString());
      expect(executor4ListIndex.toString()).to.be.equal(executor4.address.toString());

      // Remove some executor
      await this.executorsRegistry.remove(executor3.address);
      await this.executorsRegistry.remove(executor1.address);

      // Same tests again
      [executor2AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor2.address);
      [executor4AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor4.address);
      executor2ListIndex = await this.executorsRegistry.getByIndex(executor2AddressMappingIndex);
      executor4ListIndex = await this.executorsRegistry.getByIndex(executor4AddressMappingIndex);
      expect(executor2ListIndex.toString()).to.be.equal(executor2.address.toString());
      expect(executor4ListIndex.toString()).to.be.equal(executor4.address.toString());

      // Add a new executor and add previously removed executor3 again
      await this.executorsRegistry.add(executor5.address);
      await this.executorsRegistry.add(executor3.address);

      let executor5AddressMappingIndex;

      // Same tests
      [executor3AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor3.address);
      [executor5AddressMappingIndex] = await this.executorsRegistry.getExecutorId(executor5.address);
      executor3ListIndex = await this.executorsRegistry.getByIndex(executor3AddressMappingIndex);
      executor5ListIndex = await this.executorsRegistry.getByIndex(executor5AddressMappingIndex);

      expect(executor3ListIndex.toString()).to.be.equal(executor3.address.toString());
      expect(executor5ListIndex.toString()).to.be.equal(executor5.address.toString());
    });
  });

  describe("Authorizations", function () {
    it("Should allow only owner to add executor", async function() {
      await expect(
        this.executorsRegistry.connect(executor1).add(executor1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow only owner to delete executor", async function() {
      await this.executorsRegistry.add(executor1.address);
      await expect(
        this.executorsRegistry.connect(executor1).remove(executor1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
