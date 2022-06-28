const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StringsRegistry contract", function () {

  before(async function() {
    this.StringsRegistryContract = await ethers.getContractFactory("StringsRegistry");
    string1 = "AAVE";
    string2 = "UniSwap";
    string3 = "Compound";
    string4 = "SushiSwap";
    string5 = "ParaSwap";
  });

  beforeEach(async function () {
    [owner, account1] = await ethers.getSigners();

    this.stringsRegistry = await this.StringsRegistryContract.deploy(false);
    await this.stringsRegistry.deployed();
  });

  describe("Expected use-cases", function () {
    it("Should have 0 strings after deployment", async function() {
      expect((await this.stringsRegistry.size()).toString()).to.equal('0');
    });

    it("Should not contain string1", async function() {
      expect(await this.stringsRegistry.contains(string1)).to.be.false;
    });

    it("Should add 2 strings", async function() {
      await this.stringsRegistry.add(string1);
      expect(await this.stringsRegistry.contains(string1)).to.be.true;
      expect((await this.stringsRegistry.size()).toString()).to.equal('1');

      await this.stringsRegistry.add(string2);
      expect(await this.stringsRegistry.contains(string2)).to.be.true;
      expect((await this.stringsRegistry.size()).toString()).to.equal('2');
    });

    it("Should not add a string with same name (case insensitive) if unique option", async function() {
      stringsRegistryUniqueContract = await ethers.getContractFactory("StringsRegistry");
      stringsRegistryUnique = await stringsRegistryUniqueContract.deploy(true);
      expect((await stringsRegistryUnique.size()).toString()).to.equal('0');

      await stringsRegistryUnique.add(string1);
      expect(await stringsRegistryUnique.contains(string1)).to.be.true;
      expect((await stringsRegistryUnique.size()).toString()).to.equal('1');

      await expect(stringsRegistryUnique.add("aave")).to.be.revertedWith("string (case insensitive) already in map");
      expect((await stringsRegistryUnique.size()).toString()).to.equal('1');
    });

    it("Should should return true when containing string (case insensitive)", async function() {
      await this.stringsRegistry.add(string1);
      expect(await this.stringsRegistry.contains("aave")).to.be.true;
      expect(await this.stringsRegistry.contains("aAve")).to.be.true;
      expect(await this.stringsRegistry.contains("aAvE")).to.be.true;
    });

    it("Should remove 2 strings", async function() {
      await this.stringsRegistry.add(string1);
      await this.stringsRegistry.add(string2);
      await this.stringsRegistry.add(string3);
      await this.stringsRegistry.add(string4);

      await this.stringsRegistry.remove(string3);
      await this.stringsRegistry.remove(string1);

      expect(await this.stringsRegistry.contains(string3)).to.be.false;
      expect(await this.stringsRegistry.contains(string1)).to.be.false;
      expect((await this.stringsRegistry.size()).toString()).to.equal('2');
    });

    it("Should not allow to remove unexisting string", async function() {
      await expect(this.stringsRegistry.remove(string1)).to.be.revertedWith("string (case insensitive) must be present in map");
    });

    it("Should match mapping indexes with list indexes", async function() {
      // Add strings
      await this.stringsRegistry.add(string1);
      await this.stringsRegistry.add(string2);
      await this.stringsRegistry.add(string3);
      await this.stringsRegistry.add(string4);

      let string1AddressMappingIndex;
      let string2AddressMappingIndex;
      let string3AddressMappingIndex;
      let string4AddressMappingIndex;

      // Get registered indexes in mapping for each address
      string1AddressMappingIndex = await this.stringsRegistry.getStringId(string1);
      string2AddressMappingIndex = await this.stringsRegistry.getStringId(string2);
      string3AddressMappingIndex = await this.stringsRegistry.getStringId(string3);
      string4AddressMappingIndex = await this.stringsRegistry.getStringId(string4);

      // Get from the list the address stored at the mapping stored index
      let string1ListIndex = await this.stringsRegistry.getByIndex(string1AddressMappingIndex);
      let string2ListIndex = await this.stringsRegistry.getByIndex(string2AddressMappingIndex);
      let string3ListIndex = await this.stringsRegistry.getByIndex(string3AddressMappingIndex);
      let string4ListIndex = await this.stringsRegistry.getByIndex(string4AddressMappingIndex);

      // Chexk if addresses are matching between list an mapping
      expect(string1ListIndex.toString()).to.be.equal(string1.toString());
      expect(string2ListIndex.toString()).to.be.equal(string2.toString());
      expect(string3ListIndex.toString()).to.be.equal(string3.toString());
      expect(string4ListIndex.toString()).to.be.equal(string4.toString());

      // Remove some string
      await this.stringsRegistry.remove(string3);
      await this.stringsRegistry.remove(string1);

      // Same tests again
      string2AddressMappingIndex = await this.stringsRegistry.getStringId(string2);
      string4AddressMappingIndex = await this.stringsRegistry.getStringId(string4);
      string2ListIndex = await this.stringsRegistry.getByIndex(string2AddressMappingIndex);
      string4ListIndex = await this.stringsRegistry.getByIndex(string4AddressMappingIndex);
      expect(string2ListIndex.toString()).to.be.equal(string2.toString());
      expect(string4ListIndex.toString()).to.be.equal(string4.toString());

      // Add a new string and add previously removed string3 again
      await this.stringsRegistry.add(string5);
      await this.stringsRegistry.add(string3);

      let string5AddressMappingIndex;

      // Same tests
      string3AddressMappingIndex = await this.stringsRegistry.getStringId(string3);
      string5AddressMappingIndex = await this.stringsRegistry.getStringId(string5);
      string3ListIndex = await this.stringsRegistry.getByIndex(string3AddressMappingIndex);
      string5ListIndex = await this.stringsRegistry.getByIndex(string5AddressMappingIndex);

      expect(string3ListIndex.toString()).to.be.equal(string3.toString());
      expect(string5ListIndex.toString()).to.be.equal(string5.toString());
    });
  });

  describe("Authorizations", function () {
    it("Should allow only owner to add string", async function() {
      await expect(
        this.stringsRegistry.connect(account1).add(string1)
      ).to.be.revertedWith("Caller is not allowed");
    });

    it("Should allow only owner to delete string", async function() {
      await this.stringsRegistry.add(string1);
      await expect(
        this.stringsRegistry.connect(account1).remove(string1)
      ).to.be.revertedWith("Caller is not allowed");
    });
  });
});
