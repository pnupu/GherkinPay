/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/gherkin_pay_hook.json`.
 */
export type GherkinPayHook = {
  "address": "3pG9tTyExGA3C7sdvw5AcUvfmwydtRCLV22KPb6SfYRc",
  "metadata": {
    "name": "gherkinPayHook",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "GherkinPay Transfer Hook — Compliance enforcement via Token-2022"
  },
  "instructions": [
    {
      "name": "initializeExtraAccountMetaList",
      "discriminator": [
        92,
        197,
        174,
        197,
        41,
        124,
        19,
        3
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "setCompliance",
      "discriminator": [
        46,
        128,
        120,
        26,
        105,
        175,
        165,
        6
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "wallet"
        },
        {
          "name": "complianceEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  112,
                  108,
                  105,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "isAllowed",
          "type": "bool"
        }
      ]
    },
    {
      "name": "transferHook",
      "discriminator": [
        220,
        57,
        220,
        152,
        126,
        125,
        97,
        168
      ],
      "accounts": [
        {
          "name": "sourceToken"
        },
        {
          "name": "mint"
        },
        {
          "name": "destinationToken"
        },
        {
          "name": "owner"
        },
        {
          "name": "extraAccountMetaList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "sourceCompliance"
        },
        {
          "name": "destinationCompliance"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "complianceEntry",
      "discriminator": [
        3,
        112,
        228,
        41,
        214,
        132,
        1,
        249
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "senderNotCompliant",
      "msg": "Sender is not on the compliance allowlist"
    },
    {
      "code": 6001,
      "name": "receiverNotCompliant",
      "msg": "Receiver is not on the compliance allowlist"
    }
  ],
  "types": [
    {
      "name": "complianceEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isAllowed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
