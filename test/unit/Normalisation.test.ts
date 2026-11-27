import 'jest-rdf';
import { DataFactory, Store } from 'n3';
import {DependencyGraph, inferConstraints, inferPolicy, inferRules, inheritPolicies, internalization, orderByDependencies, replacePolicies} from '../../src/Normalisation';
import { NamedNode } from '@rdfjs/types';
import { ODRL, RDF } from 'odrl-atomization';
import { TEST } from '../util/Util';
import {DCT} from "../../src/util/Vocabulary";



const { quad } = DataFactory;

describe('N1: The Internalization function', () => {

    test('internalizes an externally declared assigner.', () => {

        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.party1, ODRL.terms.assignerOf, TEST.terms.policy1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.assigner, TEST.terms.party1),
        ]);

        expect(internalization(policy)).toBeRdfIsomorphic(expected);
    });

    test('internalizes an externally declared assignee.', () => {

        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.party1, ODRL.terms.assigneeOf, TEST.terms.policy1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party1),
        ]);

        expect(internalization(policy)).toBeRdfIsomorphic(expected);
    });

    test('internalizes an externally declared target.', () => {

        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.asset, ODRL.terms.hasPolicy, TEST.terms.policy1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.asset),
        ]);

        expect(internalization(policy)).toBeRdfIsomorphic(expected);
    });

    test('does nothing when there are no external declarations.', () => {

        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.assigner, TEST.terms.party1),
            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party1),
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.asset),
        ];

        expect(internalization(policy)).toBeRdfIsomorphic(policy);
    });

    test('internalizes all supported external declarations.', () => {

        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),

            quad(TEST.terms.party1, ODRL.terms.assignerOf, TEST.terms.policy1),
            quad(TEST.terms.party2, ODRL.terms.assigneeOf, TEST.terms.policy1),
            quad(TEST.terms.asset, ODRL.terms.hasPolicy, TEST.terms.policy1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),

            quad(TEST.terms.policy1, ODRL.terms.assigner, TEST.terms.party1),
            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party2),
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.asset),
        ]);

        expect(internalization(policy)).toBeRdfIsomorphic(expected);
    });

    test('internalizes an externally declared target when the target is already present.', () => {

        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.asset),
            quad(TEST.terms.asset, ODRL.terms.hasPolicy, TEST.terms.policy1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.asset),
        ]);

        expect(internalization(policy)).toBeRdfIsomorphic(expected);
    });

    test('internalizes an externally declared assignee when another assignee is already present.', () => {

        const policy = [
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),
            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party1),
            
            quad(TEST.terms.party2, ODRL.terms.assigneeOf, TEST.terms.policy1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy),

            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party1),
            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.party2),
        ]);

        expect(internalization(policy)).toBeRdfIsomorphic(expected);
    });
});

describe('N2: The Type declaration of policy elements', () => {
    describe('for the deduction of rules', () => {
        test('infers Permission type', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),

            ];

            const expected = new Store([
                quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),
                quad(TEST.terms.permission1, RDF.terms.type, ODRL.terms.Permission)
            ])
            expect(inferRules(policy)).toBeRdfIsomorphic(expected);
        })
        test('infers Prohibition type', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.prohibition, TEST.terms.prohibition1),

            ];

            const expected = new Store([
                quad(TEST.terms.policy1, ODRL.terms.prohibition, TEST.terms.prohibition1),
                quad(TEST.terms.prohibition1, RDF.terms.type, ODRL.terms.Prohibition)
            ])
            expect(inferRules(policy)).toBeRdfIsomorphic(expected);
        })
        test('infers Duty type from the obligation relation', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.obligation, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.policy1, ODRL.terms.obligation, TEST.terms.duty1),
                quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty)
            ])
            expect(inferRules(policy)).toBeRdfIsomorphic(expected);
        })
        test('infers Duty type from the duty relation', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.duty, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.policy1, ODRL.terms.duty, TEST.terms.duty1),
                quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty)
            ])
            expect(inferRules(policy)).toBeRdfIsomorphic(expected);
        })
        test('infers Duty type from the consequence relation', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.consequence, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.policy1, ODRL.terms.consequence, TEST.terms.duty1),
                quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty)
            ])
            expect(inferRules(policy)).toBeRdfIsomorphic(expected);
        })
        test('infers Duty type from the remedy relation', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.remedy, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.policy1, ODRL.terms.remedy, TEST.terms.duty1),
                quad(TEST.terms.duty1, RDF.terms.type, ODRL.terms.Duty)
            ])
            expect(inferRules(policy)).toBeRdfIsomorphic(expected);
        })
    })

    describe('for the deduction of constraints', () => {

        test('infers the constraint type from a left operand property.', () => {
            const policy = [
                quad(TEST.terms.constraint1, ODRL.terms.leftOperand, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.constraint1, ODRL.terms.leftOperand, TEST.terms.duty1),
                quad(TEST.terms.constraint1, RDF.terms.type, ODRL.terms.Constraint)
            ])
            expect(inferConstraints(policy)).toBeRdfIsomorphic(expected);
        })

        test('infers the constraint type from a right operand property.', () => {
            const policy = [
                quad(TEST.terms.constraint1, ODRL.terms.rightOperand, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.constraint1, ODRL.terms.rightOperand, TEST.terms.duty1),
                quad(TEST.terms.constraint1, RDF.terms.type, ODRL.terms.Constraint)
            ])
            expect(inferConstraints(policy)).toBeRdfIsomorphic(expected);
        })

        test('infers the constraint type from an operator property.', () => {
            const policy = [
                quad(TEST.terms.constraint1, ODRL.terms.rightOperand, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.constraint1, ODRL.terms.rightOperand, TEST.terms.duty1),
                quad(TEST.terms.constraint1, RDF.terms.type, ODRL.terms.Constraint)
            ])
            expect(inferConstraints(policy)).toBeRdfIsomorphic(expected);
        })

        test('infers the logical constraint type from an operand property.', () => {
            const policy = [
                quad(TEST.terms.constraint1, ODRL.terms.operand, TEST.terms.duty1),

            ];

            const expected = new Store([
                quad(TEST.terms.constraint1, ODRL.terms.operand, TEST.terms.duty1),
                quad(TEST.terms.constraint1, RDF.terms.type, ODRL.terms.LogicalConstraint)
            ])
            expect(inferConstraints(policy)).toBeRdfIsomorphic(expected);
        })
    })
    describe('for the deduction of policy types', () => {
        test('infers the policy type from the permission property.', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.duty1),

            ];

            const expected = new Store([
                ...policy,
                quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy)
            ])
            expect(inferPolicy(policy)).toBeRdfIsomorphic(expected);
        })

        test('infers the policy type from the prohibition property.', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.prohibition, TEST.terms.duty1),

            ];

            const expected = new Store([
                ...policy,
                quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy)
            ])
            expect(inferPolicy(policy)).toBeRdfIsomorphic(expected);
        })

        test('infers the policy type from the obligation property.', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.obligation, TEST.terms.duty1),

            ];

            const expected = new Store([
                ...policy,
                quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy)
            ])
            expect(inferPolicy(policy)).toBeRdfIsomorphic(expected);
        })

        test('infers the policy type from the profile property.', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.profile, TEST.terms.duty1),

            ];

            const expected = new Store([
                ...policy,
                quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy)
            ])
            expect(inferPolicy(policy)).toBeRdfIsomorphic(expected);
        })

        test('infers the policy type from the inheritFrom property.', () => {
            const policy = [
                quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.duty1),

            ];

            const expected = new Store([
                ...policy,
                quad(TEST.terms.policy1, RDF.terms.type, ODRL.terms.Policy)
            ])
            expect(inferPolicy(policy)).toBeRdfIsomorphic(expected);
        })
    })
})

describe('N3: The application of inheritance rules', () => {
    test('inherits permissions from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.permission, TEST.terms.permission1),
            quad(TEST.terms.permission1, ODRL.terms.assignee, TEST.terms.party1),
            quad(TEST.terms.permission1, ODRL.terms.assigner, TEST.terms.party2),
            quad(TEST.terms.permission1, ODRL.terms.target, TEST.terms.asset),
            quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.read),
            quad(TEST.terms.permission1, ODRL.terms.constraint, TEST.terms.constraint1),
        ];
        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),

            quad(TEST.terms.policy2, ODRL.terms.permission, TEST.terms.permission1),
            quad(TEST.terms.permission1, ODRL.terms.assignee, TEST.terms.party1),
            quad(TEST.terms.permission1, ODRL.terms.assigner, TEST.terms.party2),
            quad(TEST.terms.permission1, ODRL.terms.target, TEST.terms.asset),
            quad(TEST.terms.permission1, ODRL.terms.action, ODRL.terms.read),
            quad(TEST.terms.permission1, ODRL.terms.constraint, TEST.terms.constraint1),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })

    test('inherits prohibition from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.prohibition, TEST.terms.prohibition1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.prohibition, TEST.terms.prohibition1),

            quad(TEST.terms.policy2, ODRL.terms.prohibition, TEST.terms.prohibition1),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })

    test('inherits duties from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.obligation, TEST.terms.duty1),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.obligation, TEST.terms.duty1),

            quad(TEST.terms.policy2, ODRL.terms.obligation, TEST.terms.duty1),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })
    test('inherits profiles from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.profile, TEST.terms.alice),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.profile, TEST.terms.alice),

            quad(TEST.terms.policy2, ODRL.terms.profile, TEST.terms.alice),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })
    test('inherits conflicts from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.conflict, ODRL.terms.prohibit),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.conflict, ODRL.terms.prohibit),

            quad(TEST.terms.policy2, ODRL.terms.conflict, ODRL.terms.prohibit),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })

    test('inherits assignees from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.assignee, TEST.terms.alice),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.alice),

            quad(TEST.terms.policy2, ODRL.terms.assignee, TEST.terms.alice),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })
    test('inherits assigners from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.assigner, TEST.terms.alice),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.assigner, TEST.terms.alice),

            quad(TEST.terms.policy2, ODRL.terms.assigner, TEST.terms.alice),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })
    test('inherits targets from a policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),

            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
        ];

        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.alice),

            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })

    test('throws an error if the inheritance is an external policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),
        ];

        expect(() => inheritPolicies(policy)).toThrow("Policy <http://example.org/policy1> inherits from <http://example.org/policy2>, which is not defined in the input. Inheriting from external policies is not supported.");
    })
    test('throws an error if the inheritance is the same policy', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy1),
        ];

        expect(() => inheritPolicies(policy)).toThrow("V24. No policy can inherit directly or indirectly from itself");
    })
    test('throws an error if the inheritance circular', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),
            quad(TEST.terms.policy2, ODRL.terms.inheritFrom, TEST.terms.policy3),
            quad(TEST.terms.policy3, ODRL.terms.inheritFrom, TEST.terms.policy1)
        ];

        expect(() => inheritPolicies(policy)).toThrow("V24. No policy can inherit directly or indirectly from itself");
    })

    test('recursively inherits from other policies', () => {
        const policy = [
            quad(TEST.terms.policy1, ODRL.terms.inheritFrom, TEST.terms.policy2),
            quad(TEST.terms.policy2, ODRL.terms.inheritFrom, TEST.terms.policy3),

            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
            quad(TEST.terms.policy3, ODRL.terms.assigner, TEST.terms.alice),
        ];
        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.alice),
            quad(TEST.terms.policy1, ODRL.terms.assigner, TEST.terms.alice),

            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
            quad(TEST.terms.policy2, ODRL.terms.assigner, TEST.terms.alice),

            quad(TEST.terms.policy3, ODRL.terms.assigner, TEST.terms.alice),

        ])
        expect(inheritPolicies(policy)).toBeRdfIsomorphic(expected);
    })

})

describe('N10: Policy replacement', () => {
    test('throws an error if the replaced by policy is an external policy (we only allow local in this mode).', () => {
        const policy = [
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy2),
        ];

        expect(() => replacePolicies(policy)).toThrow("Policy <http://example.org/policy1> is replaced by <http://example.org/policy2>, which is not defined in the input. Replacing by external policies is not supported.");
    })

    test('throws an error if the policy is replaced by itself', () => {
        const policy = [
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy1),
        ];

        expect(() => replacePolicies(policy)).toThrow("No policy can be replaced directly or indirectly by itself");
    })

    test('throws an error if the policy to be replaced with is circular', () => {
        const policy = [
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy2),
            quad(TEST.terms.policy2, DCT.terms.isReplacedBy, TEST.terms.policy3),
            quad(TEST.terms.policy3, DCT.terms.isReplacedBy, TEST.terms.policy1)
        ];

        expect(() => replacePolicies(policy)).toThrow("No policy can be replaced directly or indirectly by itself");
    })

    test('throws an error if the policy to be replaced with two policies', () => {
        const policy = [
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy2),
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy3),

            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
            quad(TEST.terms.policy3, ODRL.terms.target, TEST.terms.alice),
        ];

        expect(() => replacePolicies(policy)).toThrow("Policy <http://example.org/policy1> is replaced by more than one policy");
    })

    test('replaces all the current policy properties with the new ones', () => {
        const policy = [
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.conflict, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.assignee, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.assigner, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.duty, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.prohibition, TEST.terms.policy2),


            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
        ];
        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.alice),

            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
        ])
        expect(replacePolicies(policy)).toBeRdfIsomorphic(expected);

    })

    test('does not copy the uid of the replacing policy', () => {
        const policy = [
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.uid, TEST.terms.policy1),

            quad(TEST.terms.policy2, ODRL.terms.uid, TEST.terms.policy2),
            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
        ];
        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.alice),

            quad(TEST.terms.policy2, ODRL.terms.uid, TEST.terms.policy2),
            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
        ])
        expect(replacePolicies(policy)).toBeRdfIsomorphic(expected);
    })

    test('recursively replaces policies', () => {
        const policy = [
            quad(TEST.terms.policy1, DCT.terms.isReplacedBy, TEST.terms.policy2),
            quad(TEST.terms.policy1, ODRL.terms.permission, TEST.terms.permission1),

            quad(TEST.terms.policy2, DCT.terms.isReplacedBy, TEST.terms.policy3),
            quad(TEST.terms.policy2, ODRL.terms.permission, TEST.terms.permission2),

            quad(TEST.terms.policy3, ODRL.terms.target, TEST.terms.alice),
        ];
        const expected = new Store([
            quad(TEST.terms.policy1, ODRL.terms.target, TEST.terms.alice),
            quad(TEST.terms.policy2, ODRL.terms.target, TEST.terms.alice),
            quad(TEST.terms.policy3, ODRL.terms.target, TEST.terms.alice),
        ])
        expect(replacePolicies(policy)).toBeRdfIsomorphic(expected);
    })
})

describe('Ordering a dependency graph', () => {
    const graph = (...edges: [NamedNode, NamedNode][]): DependencyGraph => {
        const dependencies: DependencyGraph = new Map();
        for (const [node, dependency] of edges) {
            const entry = dependencies.get(node.value) ?? { node, dependsOn: [] };
            entry.dependsOn.push(dependency);
            dependencies.set(node.value, entry);
        }
        return dependencies;
    };

    test('orders dependencies before their dependants', () => {
        const dependencies = graph(
            [TEST.terms.policy1, TEST.terms.policy2],
            [TEST.terms.policy2, TEST.terms.policy3],
        );

        const order = orderByDependencies(dependencies, "cyclic").map(({ node }) => node.value);
        expect(order).toEqual([TEST.terms.policy2.value, TEST.terms.policy1.value]);
    })

    test('throws the given error message when the graph is cyclic', () => {
        const dependencies = graph(
            [TEST.terms.policy1, TEST.terms.policy2],
            [TEST.terms.policy2, TEST.terms.policy1],
        );

        expect(() => orderByDependencies(dependencies, "cyclic")).toThrow("cyclic");
    })
})
