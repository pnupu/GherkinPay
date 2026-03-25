/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/gherkin_pay.json`.
 */
export type GherkinPay = {
  "address": "2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV",
  "metadata": {
    "name": "gherkinPay",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "GherkinPay — Condition-Based Payment Engine on Solana"
  },
  "instructions": [
    {
      "name": "addCondition",
      "discriminator": [
        92,
        223,
        119,
        30,
        151,
        178,
        173,
        245
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "payment"
          ]
        },
        {
          "name": "payment"
        },
        {
          "name": "conditionAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "condition",
          "type": {
            "defined": {
              "name": "condition"
            }
          }
        }
      ]
    },
    {
      "name": "addMilestone",
      "discriminator": [
        165,
        18,
        177,
        128,
        204,
        172,
        23,
        249
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "payment"
          ]
        },
        {
          "name": "payment",
          "writable": true
        },
        {
          "name": "conditionAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "milestoneIndex",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "operator",
          "type": {
            "defined": {
              "name": "conditionOperator"
            }
          }
        }
      ]
    },
    {
      "name": "cancelPayment",
      "discriminator": [
        217,
        129,
        71,
        37,
        216,
        193,
        38,
        33
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "payment"
          ]
        },
        {
          "name": "payment",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "escrowTokenAccount",
          "writable": true
        },
        {
          "name": "payerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "confirmWebhook",
      "discriminator": [
        38,
        142,
        134,
        35,
        231,
        3,
        81,
        95
      ],
      "accounts": [
        {
          "name": "relayer",
          "signer": true
        },
        {
          "name": "payment"
        },
        {
          "name": "conditionAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "conditionIndex",
          "type": "u8"
        },
        {
          "name": "eventHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "crankOracle",
      "discriminator": [
        133,
        135,
        250,
        161,
        77,
        193,
        0,
        6
      ],
      "accounts": [
        {
          "name": "payment"
        },
        {
          "name": "conditionAccount",
          "writable": true
        },
        {
          "name": "priceFeed"
        }
      ],
      "args": [
        {
          "name": "conditionIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "crankTime",
      "discriminator": [
        157,
        161,
        245,
        201,
        225,
        117,
        55,
        95
      ],
      "accounts": [
        {
          "name": "payment"
        },
        {
          "name": "conditionAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "conditionIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "crankTokenGate",
      "discriminator": [
        118,
        228,
        203,
        129,
        119,
        185,
        132,
        194
      ],
      "accounts": [
        {
          "name": "payment"
        },
        {
          "name": "conditionAccount",
          "writable": true
        },
        {
          "name": "holderTokenAccount"
        }
      ],
      "args": [
        {
          "name": "conditionIndex",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createMilestonePayment",
      "discriminator": [
        76,
        242,
        210,
        200,
        142,
        165,
        57,
        98
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "payerWallet"
        },
        {
          "name": "payee"
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "payment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "paymentId"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "payment"
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "paymentId",
          "type": "u64"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "milestoneCount",
          "type": "u8"
        },
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "createPayment",
      "discriminator": [
        28,
        81,
        85,
        253,
        7,
        223,
        154,
        42
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "payerWallet"
        },
        {
          "name": "payee"
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "payment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "paymentId"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "payment"
              }
            ]
          }
        },
        {
          "name": "conditionAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "paymentId",
          "type": "u64"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "operator",
          "type": {
            "defined": {
              "name": "conditionOperator"
            }
          }
        },
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "evaluateAndRelease",
      "discriminator": [
        244,
        110,
        2,
        100,
        161,
        246,
        68,
        174
      ],
      "accounts": [
        {
          "name": "payment",
          "writable": true
        },
        {
          "name": "conditionAccount",
          "writable": true
        },
        {
          "name": "nextConditionAccount",
          "docs": [
            "The next milestone's ConditionAccount (only required for milestone payments",
            "that have a subsequent milestone). Pass the same account as condition_account",
            "if this is a simple payment or the last milestone."
          ],
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "escrowTokenAccount",
          "writable": true
        },
        {
          "name": "payeeTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "finalizeConditions",
      "discriminator": [
        102,
        228,
        30,
        207,
        135,
        86,
        24,
        181
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "payment"
          ]
        },
        {
          "name": "payment"
        },
        {
          "name": "conditionAccount",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "fundPayment",
      "discriminator": [
        253,
        134,
        49,
        76,
        62,
        0,
        242,
        82
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "payment",
          "writable": true
        },
        {
          "name": "conditionAccount",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "payerTokenAccount",
          "writable": true
        },
        {
          "name": "escrowTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "signMultisig",
      "discriminator": [
        115,
        62,
        45,
        2,
        49,
        18,
        137,
        212
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "payment"
        },
        {
          "name": "conditionAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "conditionIndex",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "conditionAccount",
      "discriminator": [
        237,
        200,
        74,
        27,
        169,
        73,
        95,
        187
      ]
    },
    {
      "name": "paymentAgreement",
      "discriminator": [
        55,
        21,
        232,
        136,
        243,
        133,
        124,
        251
      ]
    }
  ],
  "events": [
    {
      "name": "conditionAdded",
      "discriminator": [
        192,
        142,
        9,
        230,
        169,
        81,
        165,
        64
      ]
    },
    {
      "name": "conditionMet",
      "discriminator": [
        162,
        157,
        80,
        222,
        211,
        200,
        90,
        236
      ]
    },
    {
      "name": "milestoneAdvanced",
      "discriminator": [
        77,
        149,
        170,
        109,
        217,
        217,
        16,
        119
      ]
    },
    {
      "name": "multisigApproval",
      "discriminator": [
        248,
        224,
        205,
        32,
        153,
        235,
        176,
        35
      ]
    },
    {
      "name": "paymentCancelled",
      "discriminator": [
        137,
        140,
        226,
        59,
        55,
        152,
        253,
        179
      ]
    },
    {
      "name": "paymentCompleted",
      "discriminator": [
        157,
        184,
        146,
        198,
        243,
        50,
        113,
        174
      ]
    },
    {
      "name": "paymentCreated",
      "discriminator": [
        174,
        8,
        230,
        213,
        220,
        35,
        198,
        204
      ]
    },
    {
      "name": "paymentFunded",
      "discriminator": [
        81,
        134,
        131,
        50,
        156,
        141,
        224,
        70
      ]
    },
    {
      "name": "paymentReleased",
      "discriminator": [
        160,
        132,
        155,
        232,
        46,
        254,
        69,
        219
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidPaymentStatus",
      "msg": "Payment is not in the expected status"
    },
    {
      "code": 6001,
      "name": "conditionsAlreadyFinalized",
      "msg": "Conditions are already finalized"
    },
    {
      "code": 6002,
      "name": "conditionsNotFinalized",
      "msg": "Conditions are not yet finalized"
    },
    {
      "code": 6003,
      "name": "maxConditionsReached",
      "msg": "Maximum number of conditions reached"
    },
    {
      "code": 6004,
      "name": "maxSignersReached",
      "msg": "Maximum number of signers reached"
    },
    {
      "code": 6005,
      "name": "signerNotInList",
      "msg": "Signer is not in the multisig signer list"
    },
    {
      "code": 6006,
      "name": "alreadyApproved",
      "msg": "Signer has already approved"
    },
    {
      "code": 6007,
      "name": "conditionTypeMismatch",
      "msg": "Condition at the given index is not the expected type"
    },
    {
      "code": 6008,
      "name": "conditionIndexOutOfBounds",
      "msg": "Condition index out of bounds"
    },
    {
      "code": 6009,
      "name": "conditionsNotMet",
      "msg": "Conditions are not met for release"
    },
    {
      "code": 6010,
      "name": "milestoneNotActive",
      "msg": "Milestone is not in active status"
    },
    {
      "code": 6011,
      "name": "allMilestonesReleased",
      "msg": "All milestones already released"
    },
    {
      "code": 6012,
      "name": "milestoneIndexMismatch",
      "msg": "Milestone index mismatch"
    },
    {
      "code": 6013,
      "name": "milestoneAmountMismatch",
      "msg": "Milestone amounts do not sum to total amount"
    },
    {
      "code": 6014,
      "name": "notAllConditionsFinalized",
      "msg": "Not all condition accounts are finalized"
    },
    {
      "code": 6015,
      "name": "notMilestonePayment",
      "msg": "Payment is not a milestone payment"
    },
    {
      "code": 6016,
      "name": "isMilestonePayment",
      "msg": "Payment is a milestone payment; use milestone-specific instructions"
    },
    {
      "code": 6017,
      "name": "oraclePriceStale",
      "msg": "Oracle price is stale"
    },
    {
      "code": 6018,
      "name": "oracleConfidenceTooWide",
      "msg": "Oracle price confidence too wide"
    },
    {
      "code": 6019,
      "name": "relayerMismatch",
      "msg": "Relayer does not match condition"
    },
    {
      "code": 6020,
      "name": "eventHashMismatch",
      "msg": "Event hash does not match condition"
    },
    {
      "code": 6021,
      "name": "tokenBalanceInsufficient",
      "msg": "Token balance insufficient for gate"
    },
    {
      "code": 6022,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6023,
      "name": "cannotCancelCompleted",
      "msg": "Cannot cancel a completed payment"
    },
    {
      "code": 6024,
      "name": "nothingToRefund",
      "msg": "Nothing to refund"
    },
    {
      "code": 6025,
      "name": "zeroMilestones",
      "msg": "Milestone count cannot be zero"
    },
    {
      "code": 6026,
      "name": "maxMilestonesExceeded",
      "msg": "Exceeded maximum milestone count"
    }
  ],
  "types": [
    {
      "name": "comparisonOperator",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "gt"
          },
          {
            "name": "gte"
          },
          {
            "name": "lt"
          },
          {
            "name": "lte"
          },
          {
            "name": "eq"
          }
        ]
      }
    },
    {
      "name": "condition",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "multisig",
            "fields": [
              {
                "name": "signers",
                "type": {
                  "vec": "pubkey"
                }
              },
              {
                "name": "threshold",
                "type": "u8"
              },
              {
                "name": "approvals",
                "type": {
                  "vec": "bool"
                }
              },
              {
                "name": "met",
                "type": "bool"
              }
            ]
          },
          {
            "name": "timeBased",
            "fields": [
              {
                "name": "unlockAt",
                "type": "i64"
              },
              {
                "name": "met",
                "type": "bool"
              }
            ]
          },
          {
            "name": "oracle",
            "fields": [
              {
                "name": "feedAccount",
                "type": "pubkey"
              },
              {
                "name": "operator",
                "type": {
                  "defined": {
                    "name": "comparisonOperator"
                  }
                }
              },
              {
                "name": "targetValue",
                "type": "i64"
              },
              {
                "name": "decimals",
                "type": "u8"
              },
              {
                "name": "met",
                "type": "bool"
              }
            ]
          },
          {
            "name": "webhook",
            "fields": [
              {
                "name": "relayer",
                "type": "pubkey"
              },
              {
                "name": "eventHash",
                "type": {
                  "array": [
                    "u8",
                    32
                  ]
                }
              },
              {
                "name": "met",
                "type": "bool"
              }
            ]
          },
          {
            "name": "tokenGated",
            "fields": [
              {
                "name": "requiredMint",
                "type": "pubkey"
              },
              {
                "name": "minAmount",
                "type": "u64"
              },
              {
                "name": "holder",
                "type": "pubkey"
              },
              {
                "name": "met",
                "type": "bool"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "conditionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "milestoneIndex",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "milestoneStatus",
            "type": {
              "defined": {
                "name": "milestoneStatus"
              }
            }
          },
          {
            "name": "operator",
            "type": {
              "defined": {
                "name": "conditionOperator"
              }
            }
          },
          {
            "name": "conditions",
            "type": {
              "vec": {
                "defined": {
                  "name": "condition"
                }
              }
            }
          },
          {
            "name": "isFinalized",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "conditionAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "milestoneIndex",
            "type": "u8"
          },
          {
            "name": "conditionIndex",
            "type": "u8"
          },
          {
            "name": "conditionType",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "conditionMet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "milestoneIndex",
            "type": "u8"
          },
          {
            "name": "conditionIndex",
            "type": "u8"
          },
          {
            "name": "conditionType",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "conditionOperator",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "and"
          },
          {
            "name": "or"
          }
        ]
      }
    },
    {
      "name": "milestoneAdvanced",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "completedIndex",
            "type": "u8"
          },
          {
            "name": "nextIndex",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "milestoneStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "active"
          },
          {
            "name": "released"
          }
        ]
      }
    },
    {
      "name": "multisigApproval",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "signer",
            "type": "pubkey"
          },
          {
            "name": "milestoneIndex",
            "type": "u8"
          },
          {
            "name": "conditionIndex",
            "type": "u8"
          },
          {
            "name": "approvalsCount",
            "type": "u8"
          },
          {
            "name": "threshold",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentAgreement",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "paymentId",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "payer",
            "type": "pubkey"
          },
          {
            "name": "payee",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "escrowTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "releasedAmount",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "paymentStatus"
              }
            }
          },
          {
            "name": "isMilestone",
            "type": "bool"
          },
          {
            "name": "milestoneCount",
            "type": "u8"
          },
          {
            "name": "currentMilestone",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          },
          {
            "name": "metadataUri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "paymentCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "paymentCompleted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "paymentCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "payer",
            "type": "pubkey"
          },
          {
            "name": "payee",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "isMilestone",
            "type": "bool"
          },
          {
            "name": "milestoneCount",
            "type": "u8"
          },
          {
            "name": "metadataUri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "paymentFunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "payer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "paymentReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payment",
            "type": "pubkey"
          },
          {
            "name": "payee",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "milestoneIndex",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "created"
          },
          {
            "name": "active"
          },
          {
            "name": "completed"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    }
  ]
};
