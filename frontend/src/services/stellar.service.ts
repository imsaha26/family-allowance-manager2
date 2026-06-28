import {
  rpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  Address,
  Contract,
  Transaction,
  Account,
} from "@stellar/stellar-sdk";
import { FamilyGroup, MemberInfo, AllowanceSchedule, PaymentRecord, ScheduleFrequency } from "@/types/contract.types";

const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const REGISTRY_ID = process.env.NEXT_PUBLIC_FAMILY_REGISTRY_CONTRACT_ID ?? "";
const DISTRIBUTOR_ID = process.env.NEXT_PUBLIC_ALLOWANCE_DISTRIBUTOR_CONTRACT_ID ?? "";

export class StellarService {
  private static rpcServer = new rpc.Server(RPC_URL);

  private static getRpcServer(): rpc.Server {
    return this.rpcServer;
  }

  // ── Read-only helper (Simulation) ──────────────────────────────────────────

  public static async readContract<T>(
    contractId: string,
    method: string,
    args: unknown[] = []
  ): Promise<T> {
    if (!contractId) throw new Error("Contract ID is not configured");

    const server = this.getRpcServer();
    const contract = new Contract(contractId);
    
    // Construct dummy source account keypair for simulation
    const dummySource = "GCTTEST0000000000000000000000000000000000000000000000000";

    // Prepare simulated transaction
    const tx = new TransactionBuilder(
      new Account(dummySource, "0"),
      {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(
        contract.call(
          method,
          ...args.map((arg) => nativeToScVal(arg))
        )
      )
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${simulation.error}`);
    }

    if (!simulation.result || !simulation.result.retval) {
      throw new Error(`Simulation returned no result for ${method}`);
    }

    return scValToNative(simulation.result.retval) as T;
  }

  // ── State-mutating helper (XDR Builder) ─────────────────────────────────────

  public static async buildTransaction(
    sourceAddress: string,
    contractId: string,
    method: string,
    args: unknown[] = []
  ): Promise<string> {
    if (!contractId) throw new Error("Contract ID is not configured");

    const server = this.getRpcServer();
    const contract = new Contract(contractId);

    // Fetch live sequence number and fee recommendations from RPC
    const accountInfo = await server.getAccount(sourceAddress).catch(() => {
      // Return placeholder sequence if account is brand new and not yet funded
      return { sequenceNumber: () => "0" };
    });

    const tx = new TransactionBuilder(
      new Account(sourceAddress, accountInfo.sequenceNumber()),
      {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(
        contract.call(
          method,
          ...args.map((arg) => nativeToScVal(arg))
        )
      )
      .setTimeout(300)
      .build();

    // Simulate to calculate resource usage (footprint, CPU, memory) and set accurate fees
    const preparedTx = await server.prepareTransaction(tx);
    return preparedTx.toXDR();
  }

  // ── Transaction Submitter ───────────────────────────────────────────────────

  public static async submitTransaction(signedXdr: string): Promise<string> {
    const server = this.getRpcServer();
    const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;
    
    const response = await server.sendTransaction(tx);
    
    if (response.status === "ERROR") {
      throw new Error(`Transaction failed: ${response.errorResult}`);
    }

    // Call built-in pollTransaction helper
    const pollResult = await server.pollTransaction(response.hash, {
      attempts: 20,
      sleepStrategy: () => 1000,
    });

    if (pollResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return response.hash;
    } else {
      throw new Error(`Transaction failed with status: ${pollResult.status}`);
    }
  }

  // ── family_registry Read Methods ────────────────────────────────────────────

  public static async getFamily(familyId: number): Promise<FamilyGroup> {
    const data = await this.readContract<any>(REGISTRY_ID, "get_family", [familyId]);
    return {
      id: Number(data.id),
      name: data.name.toString(),
      admin: data.admin,
      created_at: BigInt(data.created_at),
      active: data.active,
    };
  }

  public static async getMemberInfo(familyId: number, memberAddress: string): Promise<MemberInfo> {
    const data = await this.readContract<any>(REGISTRY_ID, "get_member_info", [
      familyId,
      new Address(memberAddress),
    ]);

    const roleString = typeof data.role === "object" ? Object.keys(data.role)[0] : data.role;

    return {
      role: (roleString || "Child") as any,
      spending_limit: BigInt(data.spending_limit),
      savings_goal: BigInt(data.savings_goal),
      active: data.active,
      joined_at: BigInt(data.joined_at),
    };
  }

  public static async getFamilyMembers(familyId: number): Promise<string[]> {
    return await this.readContract<string[]>(REGISTRY_ID, "get_family_members", [familyId]);
  }

  public static async isMember(familyId: number, memberAddress: string): Promise<boolean> {
    return await this.readContract<boolean>(REGISTRY_ID, "is_member", [
      familyId,
      new Address(memberAddress),
    ]);
  }

  // ── allowance_distributor Read Methods ──────────────────────────────────────

  public static async getSchedule(scheduleId: number): Promise<AllowanceSchedule> {
    const data = await this.readContract<any>(DISTRIBUTOR_ID, "get_schedule", [scheduleId]);
    const freqString = typeof data.frequency === "object" ? Object.keys(data.frequency)[0] : data.frequency;
    return {
      id: Number(data.id),
      family_id: Number(data.family_id),
      member: data.member,
      amount: BigInt(data.amount),
      frequency: (freqString || "Daily") as ScheduleFrequency,
      start_ledger: Number(data.start_ledger),
      active: data.active,
      created_by: data.created_by,
    };
  }

  public static async getFamilySchedules(familyId: number): Promise<AllowanceSchedule[]> {
    const list = await this.readContract<any[]>(DISTRIBUTOR_ID, "get_family_schedules", [familyId]);
    return list.map((data) => {
      const freqString = typeof data.frequency === "object" ? Object.keys(data.frequency)[0] : data.frequency;
      return {
        id: Number(data.id),
        family_id: Number(data.family_id),
        member: data.member,
        amount: BigInt(data.amount),
        frequency: (freqString || "Daily") as ScheduleFrequency,
        start_ledger: Number(data.start_ledger),
        active: data.active,
        created_by: data.created_by,
      };
    });
  }

  public static async getPaymentRecord(paymentId: number): Promise<PaymentRecord> {
    const data = await this.readContract<any>(DISTRIBUTOR_ID, "get_payment", [paymentId]);
    const statusString = typeof data.status === "object" ? Object.keys(data.status)[0] : data.status;
    return {
      id: Number(data.id),
      schedule_id: Number(data.schedule_id),
      family_id: Number(data.family_id),
      member: data.member,
      amount: BigInt(data.amount),
      status: (statusString || "Confirmed") as any,
      ledger: Number(data.ledger),
      timestamp: BigInt(data.timestamp),
    };
  }

  public static async getFamilyPayments(familyId: number, limit: number = 20): Promise<PaymentRecord[]> {
    const list = await this.readContract<any[]>(DISTRIBUTOR_ID, "get_family_payments", [familyId, limit]);
    return list.map((data) => {
      const statusString = typeof data.status === "object" ? Object.keys(data.status)[0] : data.status;
      return {
        id: Number(data.id),
        schedule_id: Number(data.schedule_id),
        family_id: Number(data.family_id),
        member: data.member,
        amount: BigInt(data.amount),
        status: (statusString || "Confirmed") as any,
        ledger: Number(data.ledger),
        timestamp: BigInt(data.timestamp),
      };
    });
  }

  // ── Write Transactions XDR Builders ────────────────────────────────────────

  public static async buildCreateFamilyTx(source: string, name: string): Promise<string> {
    return this.buildTransaction(source, REGISTRY_ID, "create_family", [
      new Address(source),
      name,
    ]);
  }

  public static async buildAddMemberTx(
    source: string,
    familyId: number,
    member: string,
    role: string
  ): Promise<string> {
    const roleArg = { [role]: null };
    return this.buildTransaction(source, REGISTRY_ID, "add_member", [
      new Address(source),
      familyId,
      new Address(member),
      roleArg,
    ]);
  }

  public static async buildRemoveMemberTx(
    source: string,
    familyId: number,
    member: string
  ): Promise<string> {
    return this.buildTransaction(source, REGISTRY_ID, "remove_member", [
      new Address(source),
      familyId,
      new Address(member),
    ]);
  }

  public static async buildUpdateMemberLimitsTx(
    source: string,
    familyId: number,
    member: string,
    spendingLimit: bigint,
    savingsGoal: bigint
  ): Promise<string> {
    return this.buildTransaction(source, REGISTRY_ID, "update_member_limits", [
      new Address(source),
      familyId,
      new Address(member),
      spendingLimit,
      savingsGoal,
    ]);
  }

  public static async buildCreateScheduleTx(
    source: string,
    familyId: number,
    member: string,
    amount: bigint,
    frequency: string,
    startLedger: number
  ): Promise<string> {
    const freqArg = { [frequency]: null };
    return this.buildTransaction(source, DISTRIBUTOR_ID, "create_schedule", [
      new Address(source),
      familyId,
      new Address(member),
      amount,
      freqArg,
      startLedger,
    ]);
  }

  public static async buildDistributeTx(source: string, scheduleId: number): Promise<string> {
    return this.buildTransaction(source, DISTRIBUTOR_ID, "distribute", [
      new Address(source),
      scheduleId,
    ]);
  }

  public static async buildDistributeAllDueTx(source: string, familyId: number): Promise<string> {
    return this.buildTransaction(source, DISTRIBUTOR_ID, "distribute_all_due", [
      new Address(source),
      familyId,
    ]);
  }
}
