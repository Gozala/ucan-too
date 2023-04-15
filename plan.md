# Workshop

## Ideas

### First invocation (registration flow)

```ts
interface Capability {
  [Participant]: {
    "workshop/join": Participant
  }
}

interface Participant {
  name: string
  email: `${string}@${domain}.${tld}`
}
```

- Render a QR with a did:key of the service
- Participants can join by invoking `workshop/join` capability using their
  own DID.
- Each participant gets delegated some score based on when they join
  - 1st gets 15 points, 2nd 10 points ... 3rd gets 8 points and everyone else gets 5 points.


### Delegation

In this exercise we want to show how delegations work. You can delegate peer `workshop/peer` capability to another peer. When they invoke delegated capability score of both participants gets multiplied. If peer has not entered workshop they score simply doubles for the `did:key` in the `with` field.

### Provide capability

Participants define their own capability provider and `announce` it to the workshop `did`. Workshop bot will attempt following things and award you with points:

1. Attempt to invoke the capability with wrong payload, award 5 points if provider fails.
2. Attempt to invoke the capability with a invalid proof chain, award 5 points if provider fails.
3. Attempt to invoke the capability with a valid payload & proof chain, award 5 points if invocations succeeds.
