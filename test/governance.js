const { expect } = require("chai");
const { ethers } = require("hardhat");


const VoteType = Enum('Against', 'For', 'Abstain');

function Enum(...options) {
    return Object.fromEntries(options.map((key, i) => [key, i]))
}



describe("Governance contract", function () {

  before(async function() {

    this.ApeGuardToken = await ethers.getContractFactory("ApeGuardToken");
    this.ApeGuardTimelock = await ethers.getContractFactory("ApeGuardTimelock");
    this.ApeGuardGovernance = await ethers.getContractFactory("ApeGuardGovernance");

    this.ProtocolsRegistry = await ethers.getContractFactory("StringsRegistry");
  });

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, address1] = await ethers.getSigners();

    this.apeGuardToken = await this.ApeGuardToken.deploy(1000);
    await this.apeGuardToken.deployed();
    await this.apeGuardToken.transfer(voter1.address, 600);
    await this.apeGuardToken.transfer(voter2.address, 200);
    await this.apeGuardToken.transfer(voter3.address, 200);
    await this.apeGuardToken.connect(voter1).delegate(voter1.address);
    await this.apeGuardToken.connect(voter2).delegate(voter2.address);
    await this.apeGuardToken.connect(voter3).delegate(voter3.address);

    this.apeGuardTimelock = await this.ApeGuardTimelock.deploy(30, [], []);
    await this.apeGuardTimelock.deployed();

    this.apeGuardGovernance = await this.ApeGuardGovernance.deploy(this.apeGuardToken.address, this.apeGuardTimelock.address);
    await this.apeGuardGovernance.deployed();

    this.apeGuardTimelock.grantRole(await this.apeGuardTimelock.PROPOSER_ROLE(), this.apeGuardGovernance.address);
    this.apeGuardTimelock.grantRole(await this.apeGuardTimelock.EXECUTOR_ROLE(), this.apeGuardGovernance.address);
    this.apeGuardTimelock.revokeRole(await this.apeGuardTimelock.TIMELOCK_ADMIN_ROLE(), owner.address);

    this.protocolsRegistry = await this.ProtocolsRegistry.deploy(true);
    await this.protocolsRegistry.deployed();

    this.protocolsRegistry.allowAddress(this.apeGuardTimelock.address);
    this.protocolsRegistry.disallowAddress(owner.address);
  });

  describe("Governance contract", function () {
    it("Proposal to add a protocol to registry", async function() {
      expect(await this.protocolsRegistry.contains("AAVE")).to.be.false;

      // Create new proposal
      description = "Proposal #1: Add address1 to registry";
      const newProposal = {
          transferCalldata: this.protocolsRegistry.interface.encodeFunctionData('add', ["AAVE"]),
          descriptionHash: ethers.utils.id(description),
          description: description
      };
      
      const proposeTx = await this.apeGuardGovernance.connect(voter1).propose(
        [this.protocolsRegistry.address],
        [0],
        [newProposal.transferCalldata],
        newProposal.description
      );

      const tx = await proposeTx.wait();
      await network.provider.send('hardhat_mine'); // wait 1 block before opening voting
      const proposalId = tx.events.find((e) => e.event == 'ProposalCreated').args.proposalId;

      // Let's vote
      await this.apeGuardGovernance.connect(voter1).castVote(proposalId, VoteType.For);
      await this.apeGuardGovernance.connect(voter2).castVote(proposalId, VoteType.For);
      await this.apeGuardGovernance.connect(voter3).castVote(proposalId, VoteType.Against);

      // Mine 45818 blocks (Voting Period)
      await network.provider.send("hardhat_mine", ["0xb2fA"]);

      const votes = await this.apeGuardGovernance.proposalVotes(proposalId);
      expect(votes.forVotes).to.be.equals(800);

      await network.provider.send("evm_increaseTime", [3600])
      await network.provider.send('evm_mine');
      
      // Queue
      await this.apeGuardGovernance.queue(
        [this.protocolsRegistry.address],
        [0],
        [newProposal.transferCalldata],
        newProposal.descriptionHash
      );

      await network.provider.send("evm_increaseTime", [30])
      await network.provider.send('evm_mine');

      // Exec
      await this.apeGuardGovernance.execute(
        [this.protocolsRegistry.address],
        [0],
        [newProposal.transferCalldata],
        newProposal.descriptionHash
      );

      expect(await this.protocolsRegistry.contains("AAVE")).to.be.true;

    });
  });
});
