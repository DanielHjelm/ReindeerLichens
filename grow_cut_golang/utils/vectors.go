package utils

func Similiarity(a1, a2, a3, b1, b2, b3 int) float64 {

	vProd := float64(a1*b1 + a2*b2 + a3*b3)
	denom := L2(a1, a2, a3) * L2(b1, b2, b3)
	return vProd / denom
}
