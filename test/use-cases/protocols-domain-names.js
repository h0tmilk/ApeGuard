const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Protocol domain names", function () {

  before(async function() {
    this.ProtocolsRegistry = await ethers.getContractFactory("StringsRegistry");
    this.DomainNamesRegistry = await ethers.getContractFactory("DomainNamesRegistry");
    this.ProtocolDomainNames = await ethers.getContractFactory("ProtocolsDomainNames");

    protocol1 = "AAVE";
    protocol2 = "UniSwap";
    protocol3 = "Compound";
    protocol4 = "SushiSwap";
    protocol5 = "ParaSwap";

    domainName1 = "domain1.com";
    domainName2 = "domain2.fr";
    domainName3 = "domain3.net";
    domainName4 = "domain4.org";
    domainName5 = "domain5.io";
  });

  beforeEach(async function () {
    [owner, account1, address1, address2, address3, address4] = await ethers.getSigners();

    this.protocolsRegistry = await this.ProtocolsRegistry.deploy(true);
    await this.protocolsRegistry.deployed();
    await this.protocolsRegistry.add(protocol1);
    await this.protocolsRegistry.add(protocol2);
    await this.protocolsRegistry.add(protocol3);

    this.domainNamesRegistry = await this.DomainNamesRegistry.deploy(true);
    await this.domainNamesRegistry.deployed();
    await this.domainNamesRegistry.add(domainName1);
    await this.domainNamesRegistry.add(domainName2);
    await this.domainNamesRegistry.add(domainName3);
    await this.domainNamesRegistry.add(domainName4);

    this.protocolDomainNames = await this.ProtocolDomainNames.deploy(this.protocolsRegistry.address, this.domainNamesRegistry.address);
    await this.protocolDomainNames.deployed();

    
  });

  describe("Expected use-cases", function () {
    it("Should have 0 links after deployment", async function() {
      expect((await this.protocolDomainNames.getLinksTotalCount()).toString()).to.equal('0');
    });
    
    it("Should correctly link protocols and addresses", async function() {
      expect(await this.protocolDomainNames.owns(protocol1, domainName1)).to.be.false;
      await this.protocolDomainNames.addDomainName(domainName1, protocol1);

      expect((await this.protocolDomainNames.getLinksTotalCount()).toString()).to.equal('1');
      expect(await this.protocolDomainNames.owns(protocol1, domainName1)).to.be.true;
      expect((await this.protocolDomainNames.ownersCount(domainName1)).toString()).to.equal('1');
      expect((await this.protocolDomainNames.getDomainNamesCount(protocol1)).toString()).to.equal('1');
      expect((await this.protocolDomainNames.getOwnerProtocolByIndex(domainName1, 0)).toString()).to.equal(protocol1);
      expect((await this.protocolDomainNames.getDomainNameByIndex(protocol1, 0)).toString()).to.equal(domainName1);

      expect(await this.protocolDomainNames.owns(protocol1, domainName2)).to.be.false;
      await this.protocolDomainNames.addDomainName(domainName2, protocol1);

      expect((await this.protocolDomainNames.getLinksTotalCount()).toString()).to.equal('2');
      expect(await this.protocolDomainNames.owns(protocol1, domainName2)).to.be.true;
      expect((await this.protocolDomainNames.ownersCount(domainName2)).toString()).to.equal('1');
      expect((await this.protocolDomainNames.getDomainNamesCount(protocol1)).toString()).to.equal('2');
      expect((await this.protocolDomainNames.getOwnerProtocolByIndex(domainName2, 0)).toString()).to.equal(protocol1);
      expect((await this.protocolDomainNames.getDomainNameByIndex(protocol1, 1)).toString()).to.equal(domainName2);

      await this.protocolDomainNames.addDomainName(domainName3, protocol2);

      expect((await this.protocolDomainNames.getLinksTotalCount()).toString()).to.equal('3');
      expect(await this.protocolDomainNames.owns(protocol2, domainName3)).to.be.true;
      expect(await this.protocolDomainNames.owns(protocol1, domainName3)).to.be.false;
      expect((await this.protocolDomainNames.ownersCount(domainName3)).toString()).to.equal('1');
      expect((await this.protocolDomainNames.getDomainNamesCount(protocol2)).toString()).to.equal('1');
      expect((await this.protocolDomainNames.getOwnerProtocolByIndex(domainName3, 0)).toString()).to.equal(protocol2);
      expect((await this.protocolDomainNames.getDomainNameByIndex(protocol2, 0)).toString()).to.equal(domainName3);

      await this.protocolDomainNames.addDomainName(domainName3, protocol1);

      expect((await this.protocolDomainNames.getLinksTotalCount()).toString()).to.equal('4');
      expect((await this.protocolDomainNames.ownersCount(domainName3)).toString()).to.equal('2');
    });

    it("Should correctly unlink protocols and addresses", async function() {
      await this.protocolDomainNames.addDomainName(domainName1, protocol1);
      await this.protocolDomainNames.addDomainName(domainName2, protocol1);
      await this.protocolDomainNames.addDomainName(domainName3, protocol1);
      await this.protocolDomainNames.addDomainName(domainName2, protocol2);

      await this.protocolDomainNames.removeDomainName(domainName1, protocol1);
      await this.protocolDomainNames.removeDomainName(domainName2, protocol2);

      expect(await this.protocolDomainNames.owns(protocol1, domainName1)).to.be.false;
      expect(await this.protocolDomainNames.owns(protocol1, domainName2)).to.be.true;
      expect(await this.protocolDomainNames.owns(protocol1, domainName3)).to.be.true;
      expect(await this.protocolDomainNames.owns(protocol2, domainName2)).to.be.false;

      expect((await this.protocolDomainNames.getLinksTotalCount()).toString()).to.equal('2');

      expect((await this.protocolDomainNames.ownersCount(domainName1)).toString()).to.equal('0');
      expect((await this.protocolDomainNames.ownersCount(domainName2)).toString()).to.equal('1');
      expect((await this.protocolDomainNames.ownersCount(domainName3)).toString()).to.equal('1');

      expect((await this.protocolDomainNames.getDomainNamesCount(protocol1)).toString()).to.equal('2');
      expect((await this.protocolDomainNames.getDomainNamesCount(protocol2)).toString()).to.equal('0');

      expect(this.protocolDomainNames.getOwnerProtocolByIndex(domainName1, 0)).to.be.revertedWith("index out of bounds");
      expect((await this.protocolDomainNames.getOwnerProtocolByIndex(domainName2, 0)).toString()).to.equal(protocol1);
      expect((await this.protocolDomainNames.getOwnerProtocolByIndex(domainName3, 0)).toString()).to.equal(protocol1);
      expect(this.protocolDomainNames.getOwnerProtocolByIndex(domainName2, 1)).to.be.revertedWith("index out of bounds");

      expect((await this.protocolDomainNames.getDomainNameByIndex(protocol1, 0)).toString()).to.equal(domainName3);
      expect((await this.protocolDomainNames.getDomainNameByIndex(protocol1, 1)).toString()).to.equal(domainName2);
      expect(this.protocolDomainNames.getDomainNameByIndex(protocol1, 2)).to.be.revertedWith("index out of bounds");
      expect(this.protocolDomainNames.getDomainNameByIndex(protocol2, 0)).to.be.revertedWith("index out of bounds");

      expect(await this.protocolDomainNames.owns(protocol1, domainName1)).to.be.false;
    });
  });
});
