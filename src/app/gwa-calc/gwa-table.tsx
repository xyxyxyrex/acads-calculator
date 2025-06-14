"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Calculator, Award, Settings, ArrowLeft } from "lucide-react"

interface CourseRow {
  id: string
  courseCode: string
  courseDescription: string
  units: string
  gpa: string
}

type ScalingSystem = "4-point" | "5-point"
type GradeFormat = "ascending" | "descending"

export default function GWATable() {
  const [scalingSystem, setScalingSystem] = useState<ScalingSystem>("4-point")
  const [gradeFormat, setGradeFormat] = useState<GradeFormat>("descending")
  const [courses, setCourses] = useState<CourseRow[]>([
    {
      id: "1",
      courseCode: "",
      courseDescription: "",
      units: "",
      gpa: "",
    },
  ])

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const router = useRouter()

  const addRow = () => {
    const newRow: CourseRow = {
      id: generateId(),
      courseCode: "",
      courseDescription: "",
      units: "",
      gpa: "",
    }
    setCourses([...courses, newRow])
  }

  const removeRow = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter((course) => course.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof Omit<CourseRow, "id">, value: string) => {
    setCourses(courses.map((course) => (course.id === id ? { ...course, [field]: value } : course)))
  }

  const getMaxGrade = () => {
    return scalingSystem === "4-point" ? 4 : 5
  }

  const isValidGrade = (grade: string) => {
    const gradeNum = parseFloat(grade)
    const maxGrade = getMaxGrade()
    return !isNaN(gradeNum) && gradeNum >= 0 && gradeNum <= maxGrade
  }

  const calculateGWA = () => {
    const maxGrade = getMaxGrade()
    const validCourses = courses.filter(
      (course) =>
        course.units && 
        course.gpa && 
        !isNaN(Number.parseFloat(course.units)) && 
        isValidGrade(course.gpa) &&
        Number.parseFloat(course.units) > 0
    )

    if (validCourses.length === 0) return "0.00"

    const totalWeightedPoints = validCourses.reduce((sum, course) => {
      let grade = Number.parseFloat(course.gpa)
      
      // If ascending format (1 = low), convert to descending format for calculation
      if (gradeFormat === "ascending") {
        grade = maxGrade - grade + 1
      }
      
      return sum + Number.parseFloat(course.units) * grade
    }, 0)

    const totalUnits = validCourses.reduce((sum, course) => {
      return sum + Number.parseFloat(course.units)
    }, 0)

    const gwa = totalUnits > 0 ? totalWeightedPoints / totalUnits : 0
    
    // Convert back to ascending format if needed for display
    if (gradeFormat === "ascending") {
      return (maxGrade - gwa + 1).toFixed(2)
    }
    
    return gwa.toFixed(2)
  }

  const getLatinHonors = (gwa: string) => {
    const gwaNum = parseFloat(gwa)
    if (isNaN(gwaNum)) return "Insufficient Data"
    
    // For Latin honors, we always use the descending format (1.0 = highest) for comparison
    const maxGrade = getMaxGrade()
    let adjustedGwa = gwaNum
    
    if (gradeFormat === "ascending") {
      // Convert ascending to descending format for Latin honors comparison
      // In ascending: 1.0 = lowest, 4.0/5.0 = highest
      // In descending: 1.0 = highest, 4.0/5.0 = lowest
      adjustedGwa = maxGrade - gwaNum + 1
    }
    
    // Latin honors are always calculated using descending format (1.0 = highest)
    if (scalingSystem === "4-point") {
      // 4-point scale descending format (1.0 = highest)
      if (adjustedGwa >= 1.00 && adjustedGwa <= 1.20) return "Summa Cum Laude"
      if (adjustedGwa > 1.20 && adjustedGwa <= 1.45) return "Magna Cum Laude"
      if (adjustedGwa > 1.45 && adjustedGwa <= 1.75) return "Cum Laude"
    } else {
      // 5-point scale descending format (1.0 = highest)
      // Convert 4-point ranges to 5-point ranges proportionally
      if (adjustedGwa >= 1.00 && adjustedGwa <= 1.25) return "Summa Cum Laude"
      if (adjustedGwa > 1.25 && adjustedGwa <= 1.56) return "Magna Cum Laude"
      if (adjustedGwa > 1.56 && adjustedGwa <= 1.94) return "Cum Laude"
    }
    
    return "No Latin Honors"
  }

  const getHonorsColor = (honors: string) => {
    switch (honors) {
      case "Summa Cum Laude": return "text-yellow-600"
      case "Magna Cum Laude": return "text-purple-600"
      case "Cum Laude": return "text-blue-600"
      default: return "text-gray-600"
    }
  }

  const clearAll = () => {
    setCourses([
      {
        id: generateId(),
        courseCode: "",
        courseDescription: "",
        units: "",
        gpa: "",
      },
    ])
  }

  const validCoursesCount = courses.filter(
    (c) =>
      c.units && 
      c.gpa && 
      !isNaN(Number.parseFloat(c.units)) && 
      isValidGrade(c.gpa) &&
      Number.parseFloat(c.units) > 0
  ).length

  const gwa = calculateGWA()
  const honors = getLatinHonors(gwa)
  const maxGrade = getMaxGrade()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-6 w-6 text-blue-600" />
                  <span>GWA Calculator</span>
                </CardTitle>
                <CardDescription>Add your courses to calculate your General Weighted Average (GWA)</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push("/")} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Home</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            

            <div className="space-y-4">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Calculator Settings</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Scaling System</label>
                      <Select value={scalingSystem} onValueChange={(value: string) => setScalingSystem(value as ScalingSystem)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4-point">4-Point Scale (0.0 - 4.0)</SelectItem>
                          <SelectItem value="5-point">5-Point Scale (0.0 - 5.0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Grade Format</label>
                      <Select value={gradeFormat} onValueChange={(value: string) => setGradeFormat(value as GradeFormat)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="descending">Descending (1.0 = Highest)</SelectItem>
                          <SelectItem value="ascending">Ascending (1.0 = Lowest)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Current Settings:</strong> {scalingSystem} scale, {gradeFormat} format 
                      (Grades range from 0.0 to {maxGrade}.0)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2 justify-between items-center">
                <Button onClick={addRow} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearAll} className="text-red-600 border-red-300 hover:bg-red-50">
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-center w-12">#</TableHead>
                      <TableHead className="font-semibold">Course Code</TableHead>
                      <TableHead className="font-semibold">Course Description</TableHead>
                      <TableHead className="font-semibold text-center">Units</TableHead>
                      <TableHead className="font-semibold text-center">Grade (0-{maxGrade})</TableHead>
                      <TableHead className="font-semibold text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course, index) => (
                      <TableRow key={course.id} className="hover:bg-gray-50">
                        <TableCell className="p-2 text-center font-medium text-gray-600">
                          {index + 1}
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            placeholder="e.g., CS101"
                            value={course.courseCode}
                            onChange={(e) => updateRow(course.id, "courseCode", e.target.value)}
                            className="border-gray-300 focus:border-blue-500"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            placeholder="e.g., Introduction to Computer Science"
                            value={course.courseDescription}
                            onChange={(e) => updateRow(course.id, "courseDescription", e.target.value)}
                            className="border-gray-300 focus:border-blue-500"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            placeholder="3"
                            value={course.units}
                            onChange={(e) => updateRow(course.id, "units", e.target.value)}
                            className="border-gray-300 focus:border-blue-500 text-center"
                            min="0"
                            step="0.5"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="number"
                            placeholder={maxGrade.toString()}
                            value={course.gpa}
                            onChange={(e) => updateRow(course.id, "gpa", e.target.value)}
                            className="border-gray-300 focus:border-blue-500 text-center"
                            min="0"
                            max={maxGrade}
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(course.id)}
                            disabled={courses.length === 1}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Results Section */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* GWA Result */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Your General Weighted Average (GWA)</h3>
                      <div className="text-4xl font-bold text-blue-600">{gwa}</div>
                      <p className="text-sm text-gray-600">
                        Based on {validCoursesCount} valid courses
                      </p>
                      <p className="text-xs text-gray-500">
                        {scalingSystem} scale, {gradeFormat} format
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Latin Honors */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center space-x-2">
                        <Award className="h-5 w-5" />
                        <span>Latin Honors</span>
                      </h3>
                      <div className={`text-2xl font-bold ${getHonorsColor(honors)}`}>
                        {honors}
                      </div>
                      <p className="text-xs text-gray-600">
                        Based on your GWA of {gwa}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 text-center pt-2">
                        NOTE: Latin honor eligibility varies, check your intitutional guidelines first.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Instructions */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">How to use:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Select your scaling system (4-point or 5-point) and grade format</li>
                    <li>• Fill in your course code and description (optional for calculation)</li>
                    <li>• Enter the number of units for each course (must be greater than 0)</li>
                    <li>• Enter your grade for each course (0.0 to {maxGrade}.0 scale)</li>
                    <li>• Your GWA will be calculated automatically based on your selected format</li>
                    <li>• Use "Add Course" to add more rows, or click the trash icon to remove courses</li>
                    <li>• Latin honors are calculated based on your selected scaling system</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
