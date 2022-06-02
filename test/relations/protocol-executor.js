const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProtocolExecutorRelation contract", function () {

  before(async function() {
    this.ExecutorsRegistryContract = await ethers.getContractFactory("ExecutorsRegistry");
    this.ProtocolsRegistryContract = await ethers.getContractFactory("ProtocolsRegistry");
    this.ProtocolExecutorRelationContract = await ethers.getContractFactory("ProtocolExecutor");
    [owner, executor1, executor2, executor3, executor4, executor5] = await ethers.getSigners();
    protocol1 = "AAVE";
    protocol2 = "UniSwap";
    protocol3 = "Compound";
    protocol4 = "SushiSwap";
    protocol5 = "ParaSwap";
  });

  beforeEach(async function () {
    this.executorsRegistry = await this.ExecutorsRegistryContract.deploy();
    await this.executorsRegistry.deployed();

    this.executorsRegistry.add(executor1);
    this.executorsRegistry.add(executor2);
    this.executorsRegistry.add(executor3);
 
    this.protocolsRegistry = await this.ProtocolsRegistryContract.deploy();
    await this.protocolsRegistry.deployed();

    this.protocolsRegistry.add(protocol1);
    this.protocolsRegistry.add(protocol2);
    this.protocolsRegistry.add(protocol3);

    this.protocolExecutorRelation = await this.ProtocolExecutorRelationContract.deploy(this.executorsRegistry.address, this.protocolsRegistry.address);
    await this.protocolExecutorRelation.deployed();
    this.executorsRegistry.transferOwnership(this.protocolExecutorRelation.address);
    this.protocolsRegistry.transferOwnership(this.protocolExecutorRelation.address);
  });

  describe("Expected use-cases", function () {
    it("Should have 0 relations after deployment", async function() {
      expect((await this.protocolExecutorRelation.getRelationsTotalCount()).toString()).to.equal('0');
    });

    it("Should have the good amount of relations after adding / removing executors", async function() {
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1);
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol2);

      expect((await this.protocolExecutorRelation.getRelationsTotalCount()).toString()).to.equal('2');

      await this.protocolExecutorRelation.disallowExecutor(executor1.address, protocol2);

      expect((await this.protocolExecutorRelation.getRelationsTotalCount()).toString()).to.equal('1');

      await this.protocolExecutorRelation.allowExecutor(executor3.address, protocol3);

      expect((await this.protocolExecutorRelation.getRelationsTotalCount()).toString()).to.equal('2');
    });

    it("Should allow 3 executors to different protocols", async function() {
      expect(await this.protocolExecutorRelation.isAllowed(executor1.address, protocol1)).to.be.false;
      expect(await this.protocolExecutorRelation.isAllowed(executor1.address, protocol2)).to.be.false;
      expect(await this.protocolExecutorRelation.isAllowed(executor2.address, protocol2)).to.be.false;
      expect(await this.protocolExecutorRelation.isAllowed(executor3.address, protocol3)).to.be.false;

      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1);
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol2);
      await this.protocolExecutorRelation.allowExecutor(executor2.address, protocol2);
      await this.protocolExecutorRelation.allowExecutor(executor3.address, protocol3);

      expect(await this.protocolExecutorRelation.isAllowed(executor1.address, protocol1)).to.be.true;
      expect(await this.protocolExecutorRelation.isAllowed(executor1.address, protocol2)).to.be.true;
      expect(await this.protocolExecutorRelation.isAllowed(executor2.address, protocol2)).to.be.true;
      expect(await this.protocolExecutorRelation.isAllowed(executor3.address, protocol3)).to.be.true;
    });

    it("Should go through protocol's allowed executors", async function() {
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1);
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol2);
      await this.protocolExecutorRelation.allowExecutor(executor2.address, protocol1);
      await this.protocolExecutorRelation.allowExecutor(executor3.address, protocol1);

      numberExecutorsP1 = await this.protocolExecutorRelation.getAllowedExecutorCount(protocol1);
      expect(numberExecutorsP1.toString()).to.equal('3');

      numberExecutorsP2 = await this.protocolExecutorRelation.getAllowedExecutorCount(protocol2);
      expect(numberExecutorsP2.toString()).to.equal('1');
      
      expect(await this.protocolExecutorRelation.getAllowedExecutorId(protocol1, 0)).to.equal(executor1.address);
      expect(await this.protocolExecutorRelation.getAllowedExecutorId(protocol1, 1)).to.equal(executor2.address);
      expect(await this.protocolExecutorRelation.getAllowedExecutorId(protocol1, 2)).to.equal(executor3.address);

      await this.protocolExecutorRelation.disallowExecutor(executor1.address, protocol1);

      expect(await this.protocolExecutorRelation.getAllowedExecutorId(protocol1, 0)).to.equal(executor3.address);
      expect(await this.protocolExecutorRelation.getAllowedExecutorId(protocol1, 1)).to.equal(executor2.address);
    });

    it("Should go through executor's allowed protocols", async function() {
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1);
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol2);
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol3);
      await this.protocolExecutorRelation.allowExecutor(executor2.address, protocol1);

      numberProtocols = await this.protocolExecutorRelation.getAllowedProtocolCount(executor1.address);
      expect(numberProtocols.toString()).to.equal('3');

      numberProtocols = await this.protocolExecutorRelation.getAllowedProtocolCount(executor2.address);
      expect(numberProtocols.toString()).to.equal('1');
      
      expect(await this.protocolExecutorRelation.getAllowedProtocolId(executor1.address, 0)).to.equal(protocol1);
      expect(await this.protocolExecutorRelation.getAllowedProtocolId(executor1.address, 1)).to.equal(protocol2);
      expect(await this.protocolExecutorRelation.getAllowedProtocolId(executor1.address, 2)).to.equal(protocol3);
      expect(await this.protocolExecutorRelation.getAllowedProtocolId(executor2.address, 0)).to.equal(protocol1);

      await this.protocolExecutorRelation.disallowExecutor(executor1.address, protocol1);

      expect(await this.protocolExecutorRelation.getAllowedProtocolId(executor1.address, 0)).to.equal(protocol3);
      expect(await this.protocolExecutorRelation.getAllowedProtocolId(executor2.address, 0)).to.equal(protocol1);
    });

    it("Should revert if protocol doesn't exist", async function() {
      await expect(
        this.protocolExecutorRelation.allowExecutor(executor1.address, "foo")
      ).to.be.revertedWith("protocol not registered");
    });

    it("Should revert if executor is already allowed for a given protocol", async function() {
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1);
      await expect(
        this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1)
      ).to.be.revertedWith("executor is already allowed");
    });

    it("Should create a new entry in ExecutorsRegistry while allowing non-existent executor", async function() {
      expect(await this.executorsRegistry.contains(executor5.address)).to.be.false;
      await this.protocolExecutorRelation.allowExecutor(executor5.address, protocol1);
      expect(await this.executorsRegistry.contains(executor5.address)).to.be.true;
    });

    it("Should remove entry in ExecutorsRegistry while disallowing last protocol of executor", async function() {
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1);
      expect(await this.executorsRegistry.contains(executor1.address)).to.be.true;
      await this.protocolExecutorRelation.disallowExecutor(executor1.address, protocol1);
      expect(await this.executorsRegistry.contains(executor1.address)).to.be.false;
    });

  });

  describe("Authorizations", function () {
    it("Should allow only owner to add executor", async function() {
      await expect(
        this.protocolExecutorRelation.connect(executor1).allowExecutor(executor1.address, protocol1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow only owner to delete executor", async function() {
      await this.protocolExecutorRelation.allowExecutor(executor1.address, protocol1)
      await expect(
        this.protocolExecutorRelation.connect(executor1).disallowExecutor(executor1.address, protocol1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
