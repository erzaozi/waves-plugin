import fs from 'fs';
import YAML from 'yaml';
import { pluginResources } from '../model/path.js';
import _ from 'lodash';

class WeightCalculator {
    constructor(roleDetail) {
        this.roleDetail = roleDetail
        this.roleWeightPath = `${pluginResources}/Weight/${roleDetail.role.roleId}.yaml`
        this.baseWeightPath = `${pluginResources}/Weight/weight.yaml`
    }

    calculate() {

        const alterAttributeName = (tag) => {
            if (["攻击", "生命", "防御"].includes(tag.attributeName) && tag.attributeValue.includes("%")) {
                tag.attributeName += "百分比";
            }
        };

        if (!Array.isArray(this.roleDetail.phantomData.equipPhantomList)) {
            this.roleDetail.phantomData.equipPhantomList = []
        }

        this.roleDetail.phantomData.equipPhantomList.forEach(phantom => {
            phantom?.mainProps.forEach(alterAttributeName);
            phantom?.subProps?.forEach(alterAttributeName);
        });

        const weaponColors = {
            5: "#9d2933",
            4: "#9f00ed",
            3: "#6640ff",
            2: "#00D200"
        };
        this.roleDetail.weaponData.color = weaponColors[this.roleDetail.weaponData.resonLevel] || "#a0a0a0";

        if (!fs.existsSync(this.roleWeightPath)) {
            return this.roleDetail;
        }

        const roleWeight = YAML.parse(fs.readFileSync(this.roleWeightPath, 'utf-8'));
        const baseWeight = YAML.parse(fs.readFileSync(this.baseWeightPath, 'utf-8'));
        this.roleDetail.weightVersion = baseWeight.version

        this.calValWeight(roleWeight, baseWeight);
        this.calTheoreticalValue(roleWeight);

        this.roleDetail.phantomData.equipPhantomList.forEach(phantom => {
            this.calPhantom(phantom, roleWeight, baseWeight);
        });

        this.roleDetail.phantomData.statistic = this.gatherTags(this.roleDetail.phantomData.equipPhantomList, roleWeight);

        return this.roleDetail;
    }

    calValWeight(roleWeight, baseWeight) {
        const addSubProp = (name, baseMax, basePercentMax, roleBase, roleWeightProp) => {
            roleWeight.subProps.push({
                name,
                weight: baseMax / roleBase / (basePercentMax / 100) * roleWeightProp
            });
        };

        const addMainProp = (cost, name, baseMax, basePercentMax, roleBase, roleWeightProp) => {
            roleWeight.mainProps[cost].push({
                name,
                weight: baseMax / roleBase / (basePercentMax / 100) * roleWeightProp
            });
        };

        addSubProp("攻击",
            baseWeight.subProps.find(tag => tag.name === "攻击").max,
            baseWeight.subProps.find(tag => tag.name === "攻击百分比").max,
            roleWeight.baseAttack,
            roleWeight.subProps.find(tag => tag.name === "攻击百分比").weight
        );

        addSubProp("生命",
            baseWeight.subProps.find(tag => tag.name === "生命").max,
            baseWeight.subProps.find(tag => tag.name === "生命百分比").max,
            roleWeight.baseHP,
            roleWeight.subProps.find(tag => tag.name === "生命百分比").weight
        );

        addSubProp("防御",
            baseWeight.subProps.find(tag => tag.name === "防御").max,
            baseWeight.subProps.find(tag => tag.name === "防御百分比").max,
            roleWeight.baseDefense,
            roleWeight.subProps.find(tag => tag.name === "防御百分比").weight
        );

        ["C4", "C3"].forEach(cost => {
            addMainProp(cost, "攻击",
                baseWeight.mainProps[cost].find(tag => tag.name === "攻击").max,
                baseWeight.mainProps[cost].find(tag => tag.name === "攻击百分比").max,
                roleWeight.baseAttack,
                roleWeight.mainProps[cost].find(tag => tag.name === "攻击百分比").weight
            );
        });

        addMainProp("C1", "生命",
            baseWeight.mainProps.C1.find(tag => tag.name === "生命").max,
            baseWeight.mainProps.C1.find(tag => tag.name === "生命百分比").max,
            roleWeight.baseHP,
            roleWeight.mainProps.C1.find(tag => tag.name === "生命百分比").weight
        );
    }

    calTheoreticalValue(roleWeight) {
        const mainPropsFactors = {
            C4: 44,
            C3: 30,
            C1: 18
        };

        roleWeight.subProps.forEach(tag => {
            tag.theoreticalValue = 21 * tag.weight;
        });

        Object.keys(mainPropsFactors).forEach(cost => {
            roleWeight.mainProps[cost].forEach(tag => {
                tag.theoreticalValue = mainPropsFactors[cost] * tag.weight;
            });
        });
    }

    calPhantom(phantom, roleWeight, baseWeight) {
        if (!phantom) return;

        let totalScore = 0;

        const formatNum = (string) =>
            Number(string.replace("%", ""));

        phantom.subProps?.forEach(tag => {
            const subprop = roleWeight.subProps.find(item => item.name === tag.attributeName);
            tag.color = this.calStyle(subprop.weight);
            totalScore += formatNum(tag.attributeValue) /
                baseWeight.subProps.find(item => item.name === tag.attributeName).max *
                subprop.theoreticalValue;
        });

        const calMainProps = (COST) => {
            phantom.mainProps.forEach(tag => {
                const name = tag.attributeName.includes("伤害加成") ? "伤害加成" : tag.attributeName;
                try {
                    totalScore += formatNum(tag.attributeValue) /
                        baseWeight.mainProps[COST].find(item => item.name === name).max *
                        roleWeight.mainProps[COST].find(item => item.name === name).theoreticalValue;
                } catch (error) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`疑似该声骸属性异常`), logger.red(JSON.stringify(phantom)));
                }
            });
        };

        const mainPropsFactorMap = {
            4: () => {
                calMainProps("C4");
                return 22 + roleWeight.mainProps.C4.find(tag => tag.name === "攻击").weight *
                    roleWeight.mainProps.C3.find(tag => tag.name === "攻击百分比").theoreticalValue;
            },
            3: () => {
                calMainProps("C3");
                return 22.5 + roleWeight.mainProps.C3.find(tag => tag.name === "攻击").theoreticalValue;
            },
            1: () => {
                calMainProps("C1");
                return 18 + roleWeight.mainProps.C1.find(tag => tag.name === "生命").theoreticalValue;
            }
        };

        const subPropsFactor = _.orderBy(roleWeight.subProps, ['theoreticalValue'], ['desc'])
            .slice(0, 5)
            .reduce((sum, tag) => sum + tag.theoreticalValue, 0);

        const mainPropsFactor = mainPropsFactorMap[phantom.cost]?.() || 0;

        const factor = 25 / (subPropsFactor + mainPropsFactor);
        phantom.realScore = factor * totalScore;
        [phantom.rank, phantom.color] = this.calRank(phantom.realScore);
    }

    gatherTags(phantomList, roleWeight) {
        const defaultTags = [
            "暴击伤害", "暴击", "攻击百分比", "生命百分比",
            "防御百分比", "共鸣效率", "普攻伤害加成",
            "重击伤害加成", "共鸣技能伤害加成",
            "共鸣解放伤害加成", "攻击", "生命", "防御"
        ];

        const dist = defaultTags.map(name => ({
            name,
            value: 0,
            color: this.calStyle(roleWeight.subProps.find(item => item.name === name)?.weight || 0)
        }));

        let totalScore = phantomList.reduce((sum, phantom) => {
            if (!phantom) return sum;
            sum += phantom.realScore;
            phantom.subProps?.forEach(tag => {
                const index = dist.findIndex(item => item.name === tag.attributeName);
                if (index !== -1) {
                    dist[index].value += Number(tag.attributeValue.replace('%', ''));
                }
            });
            return sum;
        }, 0);

        const [rank, color] = this.calRank(totalScore / 5);
        return { totalScore, dist, rank, color };
    }

    calStyle(weight) {
        return weight > 0.5 ? "#9d2933"
            : weight > 0 ? "#057748"
                : "#a0a0a0";
    }

    calRank(score) {
        const ranks = [
            { minScore: 22, name: "MAX", color: "#9d2933" },
            { minScore: 19, name: "ACE", color: "#f08a5d" },
            { minScore: 17, name: "SSS", color: "#eec900" },
            { minScore: 15, name: "SS", color: "#eec900" },
            { minScore: 12, name: "S", color: "#eec900" },
            { minScore: 9, name: "A", color: "#9f00ed" },
            { minScore: 6, name: "B", color: "#6640ff" },
            { minScore: 3, name: "C", color: "#00D200" },
            { minScore: 0, name: "D", color: "#a0a0a0" },
        ];

        for (const rank of ranks) {
            if (score >= rank.minScore) {
                return [rank.name, rank.color];
            }
        }
    }
}

export default WeightCalculator