import { useState, useEffect, useRef } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface EmailAutocompleteProps {
  onSelect: (email: string) => void
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
}

export function EmailAutocomplete({ 
  onSelect, 
  value,
  onChange,
  className,
  ...props 
}: EmailAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 2) {
        setSuggestions([])
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/users/suggestions?query=${encodeURIComponent(value)}`)
        const data = await response.json()
        
        if (data.users) {
          setSuggestions(data.users)
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        {...props}
        value={value}
        onChange={onChange}
        className={cn("relative", className)}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md bg-popover border shadow-md">
          {suggestions.map((email, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
              onClick={() => {
                onSelect(email)
                setIsOpen(false)
              }}
            >
              {email}
            </li>
          ))}
        </ul>
      )}
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
} 